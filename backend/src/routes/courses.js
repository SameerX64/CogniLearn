const express = require('express');
const Course = require('../models/Course');
const User = require('../models/User');
const { auth, optionalAuth } = require('../middleware/auth');
const axios = require('axios');

const router = express.Router();

// AI service URL - this should point to your Python AI service
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

// Get all courses with filtering and pagination
router.get('/', optionalAuth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      category,
      level,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      minRating,
      maxPrice,
      featured
    } = req.query;

    // Build filter object
    const filter = { status: 'published', isPublic: true };

    if (category) filter.category = category;
    if (level) filter.level = level;
    if (featured === 'true') filter.isFeatured = true;
    if (minRating) filter['ratings.average'] = { $gte: parseFloat(minRating) };
    if (maxPrice) filter.price = { $lte: parseFloat(maxPrice) };

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } },
        { skills: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [courses, total] = await Promise.all([
      Course.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .select('-lessons.content -reviews') // Exclude heavy content
        .lean(),
      Course.countDocuments(filter)
    ]);

    // Add enrollment status if user is authenticated
    if (req.user) {
      const userCourses = req.user.courses.map(c => c.courseId.toString());
      courses.forEach(course => {
        course.isEnrolled = userCourses.includes(course._id.toString());
      });
    }

    res.json({
      courses,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({
      error: 'Failed to fetch courses'
    });
  }
});

// Get featured courses
router.get('/featured', optionalAuth, async (req, res) => {
  try {
    const courses = await Course.find({
      status: 'published',
      isPublic: true,
      isFeatured: true
    })
    .sort({ 'ratings.average': -1, 'enrollment.count': -1 })
    .limit(6)
    .select('-lessons.content -reviews')
    .lean();

    // Add enrollment status if user is authenticated
    if (req.user) {
      const userCourses = req.user.courses.map(c => c.courseId.toString());
      courses.forEach(course => {
        course.isEnrolled = userCourses.includes(course._id.toString());
      });
    }

    res.json({ courses });
  } catch (error) {
    console.error('Get featured courses error:', error);
    res.status(500).json({
      error: 'Failed to fetch featured courses'
    });
  }
});

// Get course recommendations for authenticated user
router.get('/recommendations', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    // Prepare user data for AI recommendation service
    const userData = {
      expertise: user.expertise,
      interests: user.interests,
      preferences: user.preferences,
      enrolledCourses: user.courses.map(c => c.courseId),
      learningGoals: user.learningGoals
    };

    // Call AI service for recommendations
    try {
      const aiResponse = await axios.post(`${AI_SERVICE_URL}/api/recommendations`, {
        user: userData,
        limit: 10
      });

      const recommendedCourseIds = aiResponse.data.recommendations;
      
      // Fetch recommended courses from database
      const courses = await Course.find({
        _id: { $in: recommendedCourseIds },
        status: 'published',
        isPublic: true
      })
      .select('-lessons.content -reviews')
      .lean();

      // Sort courses by recommendation order
      const sortedCourses = recommendedCourseIds.map(id => 
        courses.find(course => course._id.toString() === id.toString())
      ).filter(Boolean);

      res.json({ 
        courses: sortedCourses,
        algorithm: 'ai-powered'
      });
    } catch (aiError) {
      console.log('AI service unavailable, falling back to simple recommendations');
      
      // Fallback: Simple recommendation based on user interests and expertise
      const userInterests = user.interests || [];
      const userCategories = user.expertise.map(exp => exp.subject);
      
      const fallbackCourses = await Course.find({
        status: 'published',
        isPublic: true,
        _id: { $nin: user.courses.map(c => c.courseId) },
        $or: [
          { category: { $in: [...userInterests, ...userCategories] } },
          { tags: { $in: userInterests } },
          { skills: { $in: userInterests } }
        ]
      })
      .sort({ 'ratings.average': -1 })
      .limit(10)
      .select('-lessons.content -reviews')
      .lean();

      res.json({ 
        courses: fallbackCourses,
        algorithm: 'fallback'
      });
    }
  } catch (error) {
    console.error('Get recommendations error:', error);
    res.status(500).json({
      error: 'Failed to fetch recommendations'
    });
  }
});

// Get course by ID
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const course = await Course.findOne({
      _id: req.params.id,
      status: 'published',
      isPublic: true
    })
    .populate('reviews.userId', 'firstName lastName avatar')
    .lean();

    if (!course) {
      return res.status(404).json({
        error: 'Course not found'
      });
    }

    // Add enrollment status and progress if user is authenticated
    if (req.user) {
      const userCourse = req.user.courses.find(
        c => c.courseId.toString() === course._id.toString()
      );
      
      course.isEnrolled = !!userCourse;
      course.userProgress = userCourse ? userCourse.progress : 0;
      course.enrollmentStatus = userCourse ? userCourse.status : null;
    }

    res.json({ course });
  } catch (error) {
    console.error('Get course error:', error);
    res.status(500).json({
      error: 'Failed to fetch course'
    });
  }
});

// Enroll in a course
router.post('/:id/enroll', auth, async (req, res) => {
  try {
    const course = await Course.findOne({
      _id: req.params.id,
      status: 'published',
      isPublic: true
    });

    if (!course) {
      return res.status(404).json({
        error: 'Course not found'
      });
    }

    const user = await User.findById(req.user._id);
    
    // Check if already enrolled
    const existingEnrollment = user.courses.find(
      c => c.courseId.toString() === course._id.toString()
    );

    if (existingEnrollment) {
      return res.status(400).json({
        error: 'Already enrolled in this course'
      });
    }

    // Add course to user's enrolled courses
    user.courses.push({
      courseId: course._id,
      enrolledAt: new Date(),
      progress: 0,
      status: 'enrolled'
    });

    await user.save();

    // Increment course enrollment count
    await course.incrementEnrollment();

    res.json({
      message: 'Successfully enrolled in course',
      enrollment: {
        courseId: course._id,
        courseTitle: course.title,
        enrolledAt: new Date(),
        progress: 0,
        status: 'enrolled'
      }
    });
  } catch (error) {
    console.error('Enroll course error:', error);
    res.status(500).json({
      error: 'Failed to enroll in course'
    });
  }
});

// Update course progress
router.patch('/:id/progress', auth, async (req, res) => {
  try {
    const { progress, lessonId, timeSpent } = req.body;

    if (progress < 0 || progress > 100) {
      return res.status(400).json({
        error: 'Progress must be between 0 and 100'
      });
    }

    const user = await User.findById(req.user._id);
    const courseIndex = user.courses.findIndex(
      c => c.courseId.toString() === req.params.id
    );

    if (courseIndex === -1) {
      return res.status(404).json({
        error: 'Course enrollment not found'
      });
    }

    // Update progress
    user.courses[courseIndex].progress = progress;
    
    // Mark as completed if progress is 100%
    if (progress >= 100) {
      user.courses[courseIndex].status = 'completed';
      user.statistics.totalCoursesCompleted++;
      
      // Add achievement for course completion
      const course = await Course.findById(req.params.id);
      await user.addAchievement({
        title: 'Course Completed',
        description: `Completed "${course.title}"`,
        badgeIcon: '🎓',
        earnedAt: new Date()
      });
    }

    // Update learning time
    if (timeSpent) {
      user.statistics.totalLearningTime += timeSpent;
    }

    await user.save();

    res.json({
      message: 'Progress updated successfully',
      progress: user.courses[courseIndex].progress,
      status: user.courses[courseIndex].status
    });
  } catch (error) {
    console.error('Update progress error:', error);
    res.status(500).json({
      error: 'Failed to update progress'
    });
  }
});

// Add course review
router.post('/:id/review', auth, async (req, res) => {
  try {
    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        error: 'Rating must be between 1 and 5'
      });
    }

    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({
        error: 'Course not found'
      });
    }

    // Check if user is enrolled
    const user = await User.findById(req.user._id);
    const isEnrolled = user.courses.some(
      c => c.courseId.toString() === course._id.toString()
    );

    if (!isEnrolled) {
      return res.status(403).json({
        error: 'You must be enrolled in the course to review it'
      });
    }

    await course.addReview(req.user._id, rating, comment);

    res.json({
      message: 'Review added successfully',
      rating: course.ratings.average,
      reviewCount: course.ratings.count
    });
  } catch (error) {
    console.error('Add review error:', error);
    res.status(500).json({
      error: 'Failed to add review'
    });
  }
});

// Get course categories
router.get('/meta/categories', async (req, res) => {
  try {
    const categories = await Course.distinct('category', {
      status: 'published',
      isPublic: true
    });

    res.json({ categories: categories.sort() });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      error: 'Failed to fetch categories'
    });
  }
});

module.exports = router;
