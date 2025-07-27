const express = require('express');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Get mentor recommendations
router.get('/recommendations', auth, async (req, res) => {
  try {
    const { subjects, limit = 5 } = req.query;
    
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    // Determine subjects to search for
    const searchSubjects = subjects 
      ? subjects.split(',') 
      : user.expertise.map(exp => exp.subject);

    if (searchSubjects.length === 0) {
      return res.json({
        mentors: [],
        message: 'No subjects specified for mentor search'
      });
    }

    // Get user's expertise levels for comparison
    const userExpertise = {};
    user.expertise.forEach(exp => {
      userExpertise[exp.subject] = exp.level;
    });

    // Find potential mentors
    const potentialMentors = await User.find({
      _id: { $ne: user._id }, // Exclude current user
      role: { $in: ['mentor', 'student'] }, // Include both mentors and advanced students
      'expertise.subject': { $in: searchSubjects },
      isEmailVerified: true
    })
    .select('firstName lastName username avatar bio expertise statistics lastActiveAt')
    .lean();

    // Filter and score mentors
    const scoredMentors = potentialMentors
      .map(mentor => {
        let score = 0;
        let canMentor = false;
        const mentorExpertise = {};
        
        mentor.expertise.forEach(exp => {
          mentorExpertise[exp.subject] = exp.level;
        });

        // Check if mentor has higher expertise in any of the search subjects
        searchSubjects.forEach(subject => {
          const userLevel = userExpertise[subject] || 0;
          const mentorLevel = mentorExpertise[subject] || 0;
          
          // Mentor should be at least 2 levels higher, but not more than 6 levels
          const levelDiff = mentorLevel - userLevel;
          if (levelDiff >= 2 && levelDiff <= 6) {
            canMentor = true;
            score += levelDiff * 10; // Base score from level difference
          }
        });

        if (!canMentor) return null;

        // Additional scoring factors
        score += mentor.statistics.totalCoursesCompleted * 2;
        score += Math.min(mentor.statistics.averageQuizScore, 100);
        score += mentor.statistics.longestStreak;

        // Activity bonus (recent activity)
        const daysSinceActive = (Date.now() - new Date(mentor.lastActiveAt)) / (1000 * 60 * 60 * 24);
        if (daysSinceActive <= 7) score += 20;
        else if (daysSinceActive <= 30) score += 10;

        // Experience bonus
        const overallLevel = mentor.expertise.reduce((sum, exp) => sum + exp.level, 0) / mentor.expertise.length;
        score += overallLevel * 5;

        return {
          ...mentor,
          mentorScore: Math.round(score),
          subjectMatch: searchSubjects.filter(subject => 
            mentorExpertise[subject] > (userExpertise[subject] || 0)
          ),
          overallExpertise: Math.round(overallLevel)
        };
      })
      .filter(Boolean) // Remove null entries
      .sort((a, b) => b.mentorScore - a.mentorScore) // Sort by score
      .slice(0, parseInt(limit)); // Limit results

    res.json({
      mentors: scoredMentors.map(mentor => ({
        id: mentor._id,
        firstName: mentor.firstName,
        lastName: mentor.lastName,
        username: mentor.username,
        avatar: mentor.avatar,
        bio: mentor.bio,
        expertise: mentor.expertise,
        statistics: {
          coursesCompleted: mentor.statistics.totalCoursesCompleted,
          averageQuizScore: mentor.statistics.averageQuizScore,
          streak: mentor.statistics.longestStreak
        },
        overallExpertise: mentor.overallExpertise,
        subjectMatch: mentor.subjectMatch,
        score: mentor.mentorScore,
        lastActiveAt: mentor.lastActiveAt
      })),
      searchSubjects,
      userExpertise: user.expertise
    });
  } catch (error) {
    console.error('Get mentor recommendations error:', error);
    res.status(500).json({
      error: 'Failed to fetch mentor recommendations'
    });
  }
});

// Search mentors
router.get('/search', auth, async (req, res) => {
  try {
    const { 
      query, 
      subject, 
      minLevel, 
      maxLevel,
      page = 1, 
      limit = 10 
    } = req.query;

    const filter = {
      _id: { $ne: req.user._id },
      isEmailVerified: true
    };

    // Text search
    if (query) {
      filter.$or = [
        { firstName: { $regex: query, $options: 'i' } },
        { lastName: { $regex: query, $options: 'i' } },
        { username: { $regex: query, $options: 'i' } },
        { bio: { $regex: query, $options: 'i' } },
        { 'expertise.subject': { $regex: query, $options: 'i' } }
      ];
    }

    // Subject filter
    if (subject) {
      filter['expertise.subject'] = subject;
    }

    // Expertise level filter
    if (minLevel || maxLevel) {
      const levelFilter = {};
      if (minLevel) levelFilter.$gte = parseInt(minLevel);
      if (maxLevel) levelFilter.$lte = parseInt(maxLevel);
      filter['expertise.level'] = levelFilter;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [mentors, total] = await Promise.all([
      User.find(filter)
        .select('firstName lastName username avatar bio expertise statistics lastActiveAt')
        .sort({ 'statistics.averageQuizScore': -1, lastActiveAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      User.countDocuments(filter)
    ]);

    // Calculate overall expertise for each mentor
    const mentorsWithScore = mentors.map(mentor => ({
      ...mentor,
      overallExpertise: mentor.expertise.length > 0
        ? Math.round(mentor.expertise.reduce((sum, exp) => sum + exp.level, 0) / mentor.expertise.length)
        : 0
    }));

    res.json({
      mentors: mentorsWithScore,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Search mentors error:', error);
    res.status(500).json({
      error: 'Failed to search mentors'
    });
  }
});

// Get mentor profile
router.get('/:id/profile', auth, async (req, res) => {
  try {
    const mentor = await User.findById(req.params.id)
      .select('-password -email') // Exclude sensitive info
      .populate('courses.courseId', 'title category level')
      .lean();

    if (!mentor) {
      return res.status(404).json({
        error: 'Mentor not found'
      });
    }

    // Calculate mentor stats
    const overallExpertise = mentor.expertise.length > 0
      ? Math.round(mentor.expertise.reduce((sum, exp) => sum + exp.level, 0) / mentor.expertise.length)
      : 0;

    const mentorProfile = {
      id: mentor._id,
      firstName: mentor.firstName,
      lastName: mentor.lastName,
      username: mentor.username,
      avatar: mentor.avatar,
      bio: mentor.bio,
      role: mentor.role,
      expertise: mentor.expertise,
      interests: mentor.interests,
      achievements: mentor.achievements.slice(0, 10), // Show top 10 achievements
      statistics: mentor.statistics,
      overallExpertise,
      memberSince: mentor.createdAt,
      lastActiveAt: mentor.lastActiveAt,
      courses: {
        total: mentor.courses.length,
        completed: mentor.courses.filter(c => c.status === 'completed').length,
        recent: mentor.courses
          .filter(c => c.status === 'completed')
          .sort((a, b) => new Date(b.enrolledAt) - new Date(a.enrolledAt))
          .slice(0, 5)
          .map(c => ({
            title: c.courseId.title,
            category: c.courseId.category,
            level: c.courseId.level,
            completedAt: c.enrolledAt
          }))
      }
    };

    res.json({ mentor: mentorProfile });
  } catch (error) {
    console.error('Get mentor profile error:', error);
    res.status(500).json({
      error: 'Failed to fetch mentor profile'
    });
  }
});

// Send mentor request/message (placeholder for future messaging system)
router.post('/:id/contact', auth, async (req, res) => {
  try {
    const { message, subject } = req.body;

    if (!message) {
      return res.status(400).json({
        error: 'Message is required'
      });
    }

    const mentor = await User.findById(req.params.id);
    if (!mentor) {
      return res.status(404).json({
        error: 'Mentor not found'
      });
    }

    // For now, just return success
    // In a real app, you'd implement a messaging system
    res.json({
      message: 'Contact request sent successfully',
      note: 'Messaging system to be implemented'
    });
  } catch (error) {
    console.error('Contact mentor error:', error);
    res.status(500).json({
      error: 'Failed to send contact request'
    });
  }
});

// Get available subjects for mentor filtering
router.get('/meta/subjects', async (req, res) => {
  try {
    const subjects = await User.distinct('expertise.subject', {
      isEmailVerified: true,
      'expertise.0': { $exists: true } // Has at least one expertise
    });

    res.json({ subjects: subjects.sort() });
  } catch (error) {
    console.error('Get mentor subjects error:', error);
    res.status(500).json({
      error: 'Failed to fetch subjects'
    });
  }
});

module.exports = router;
