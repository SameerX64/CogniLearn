const express = require('express');
const User = require('../models/User');
const { auth, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Get public user profile
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -email') // Exclude sensitive information
      .populate('courses.courseId', 'title thumbnail category level')
      .lean();

    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    // Calculate profile completeness
    const requiredFields = ['firstName', 'lastName', 'bio', 'avatar', 'interests', 'expertise'];
    const completedFields = requiredFields.filter(field => {
      if (field === 'interests' || field === 'expertise') {
        return user[field] && user[field].length > 0;
      }
      return user[field] && user[field].toString().trim().length > 0;
    });
    const profileCompleteness = Math.round((completedFields.length / requiredFields.length) * 100);

    // Calculate overall expertise level
    const overallExpertise = user.expertise.length > 0
      ? Math.round(user.expertise.reduce((sum, exp) => sum + exp.level, 0) / user.expertise.length)
      : 0;

    const publicProfile = {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      avatar: user.avatar,
      bio: user.bio,
      role: user.role,
      expertise: user.expertise,
      interests: user.interests,
      achievements: user.achievements
        .sort((a, b) => new Date(b.earnedAt) - new Date(a.earnedAt))
        .slice(0, 10), // Show top 10 recent achievements
      statistics: {
        totalCoursesCompleted: user.statistics.totalCoursesCompleted,
        totalQuizzesTaken: user.statistics.totalQuizzesTaken,
        averageQuizScore: user.statistics.averageQuizScore,
        longestStreak: user.statistics.longestStreak
      },
      overallExpertise,
      profileCompleteness,
      memberSince: user.createdAt,
      lastActiveAt: user.lastActiveAt,
      courses: {
        total: user.courses.length,
        completed: user.courses.filter(c => c.status === 'completed').length,
        inProgress: user.courses.filter(c => c.status === 'enrolled').length
      }
    };

    // If viewing own profile or if requester is authenticated, show more details
    if (req.user && (req.user._id.toString() === user._id.toString() || req.user.role === 'admin')) {
      publicProfile.email = user.email;
      publicProfile.learningGoals = user.learningGoals;
      publicProfile.preferences = user.preferences;
      publicProfile.isEmailVerified = user.isEmailVerified;
      publicProfile.courses.details = user.courses.map(course => ({
        courseId: course.courseId._id,
        title: course.courseId.title,
        thumbnail: course.courseId.thumbnail,
        category: course.courseId.category,
        level: course.courseId.level,
        progress: course.progress,
        status: course.status,
        enrolledAt: course.enrolledAt
      }));
    }

    res.json({ profile: publicProfile });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      error: 'Failed to fetch profile'
    });
  }
});

// Update profile
router.put('/me', auth, async (req, res) => {
  try {
    const allowedUpdates = [
      'firstName', 'lastName', 'bio', 'avatar', 'interests', 
      'learningGoals', 'preferences', 'expertise'
    ];
    
    const updates = {};
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    // Validate expertise if being updated
    if (updates.expertise) {
      if (!Array.isArray(updates.expertise)) {
        return res.status(400).json({
          error: 'Expertise must be an array'
        });
      }

      // Validate each expertise entry
      for (const exp of updates.expertise) {
        if (!exp.subject || typeof exp.subject !== 'string') {
          return res.status(400).json({
            error: 'Each expertise entry must have a subject'
          });
        }
        if (exp.level && (exp.level < 1 || exp.level > 10)) {
          return res.status(400).json({
            error: 'Expertise level must be between 1 and 10'
          });
        }
      }
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    // Calculate profile completeness
    const requiredFields = ['firstName', 'lastName', 'bio', 'avatar', 'interests', 'expertise'];
    const completedFields = requiredFields.filter(field => {
      if (field === 'interests' || field === 'expertise') {
        return user[field] && user[field].length > 0;
      }
      return user[field] && user[field].toString().trim().length > 0;
    });
    const profileCompleteness = Math.round((completedFields.length / requiredFields.length) * 100);

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
        role: user.role,
        expertise: user.expertise,
        interests: user.interests,
        learningGoals: user.learningGoals,
        preferences: user.preferences,
        overallExpertise: user.overallExpertise,
        profileCompleteness
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      error: 'Failed to update profile'
    });
  }
});

// Upload avatar
router.post('/me/avatar', auth, async (req, res) => {
  try {
    const { avatar } = req.body;

    if (!avatar) {
      return res.status(400).json({
        error: 'Avatar URL is required'
      });
    }

    // In a real app, you'd handle file upload here
    // For now, we just accept a URL
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { avatar },
      { new: true }
    ).select('-password');

    res.json({
      message: 'Avatar updated successfully',
      avatar: user.avatar
    });
  } catch (error) {
    console.error('Upload avatar error:', error);
    res.status(500).json({
      error: 'Failed to upload avatar'
    });
  }
});

// Add expertise
router.post('/me/expertise', auth, async (req, res) => {
  try {
    const { subject, level = 1 } = req.body;

    if (!subject) {
      return res.status(400).json({
        error: 'Subject is required'
      });
    }

    if (level < 1 || level > 10) {
      return res.status(400).json({
        error: 'Level must be between 1 and 10'
      });
    }

    const user = await User.findById(req.user._id);
    
    // Check if expertise already exists
    const existingIndex = user.expertise.findIndex(exp => exp.subject === subject);
    
    if (existingIndex !== -1) {
      // Update existing expertise
      user.expertise[existingIndex].level = level;
    } else {
      // Add new expertise
      user.expertise.push({ subject, level });
    }

    await user.save();

    res.json({
      message: 'Expertise updated successfully',
      expertise: user.expertise,
      overallExpertise: user.overallExpertise
    });
  } catch (error) {
    console.error('Add expertise error:', error);
    res.status(500).json({
      error: 'Failed to update expertise'
    });
  }
});

// Remove expertise
router.delete('/me/expertise/:subject', auth, async (req, res) => {
  try {
    const { subject } = req.params;

    const user = await User.findById(req.user._id);
    
    // Remove expertise
    user.expertise = user.expertise.filter(exp => exp.subject !== subject);
    
    await user.save();

    res.json({
      message: 'Expertise removed successfully',
      expertise: user.expertise,
      overallExpertise: user.overallExpertise
    });
  } catch (error) {
    console.error('Remove expertise error:', error);
    res.status(500).json({
      error: 'Failed to remove expertise'
    });
  }
});

// Get profile suggestions (people you may know)
router.get('/suggestions', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    // Find users with similar interests or expertise
    const suggestions = await User.find({
      _id: { $ne: user._id },
      $or: [
        { interests: { $in: user.interests } },
        { 'expertise.subject': { $in: user.expertise.map(e => e.subject) } }
      ],
      isEmailVerified: true
    })
    .select('firstName lastName username avatar bio expertise interests statistics')
    .limit(10)
    .lean();

    // Score suggestions based on similarity
    const scoredSuggestions = suggestions.map(suggestion => {
      let score = 0;
      
      // Interest overlap
      const commonInterests = suggestion.interests.filter(
        interest => user.interests.includes(interest)
      );
      score += commonInterests.length * 2;

      // Expertise overlap
      const commonSubjects = suggestion.expertise.filter(
        exp => user.expertise.some(userExp => userExp.subject === exp.subject)
      );
      score += commonSubjects.length * 3;

      // Activity level
      const daysSinceActive = (Date.now() - new Date(suggestion.lastActiveAt)) / (1000 * 60 * 60 * 24);
      if (daysSinceActive <= 7) score += 5;
      else if (daysSinceActive <= 30) score += 2;

      return {
        ...suggestion,
        similarityScore: score,
        commonInterests,
        commonSubjects: commonSubjects.map(exp => exp.subject)
      };
    })
    .filter(s => s.similarityScore > 0)
    .sort((a, b) => b.similarityScore - a.similarityScore)
    .slice(0, 5);

    res.json({ suggestions: scoredSuggestions });
  } catch (error) {
    console.error('Get suggestions error:', error);
    res.status(500).json({
      error: 'Failed to fetch profile suggestions'
    });
  }
});

// Search users
router.get('/search', auth, async (req, res) => {
  try {
    const { q, subject, role, page = 1, limit = 10 } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        error: 'Search query must be at least 2 characters'
      });
    }

    const filter = {
      _id: { $ne: req.user._id },
      isEmailVerified: true,
      $or: [
        { firstName: { $regex: q, $options: 'i' } },
        { lastName: { $regex: q, $options: 'i' } },
        { username: { $regex: q, $options: 'i' } },
        { bio: { $regex: q, $options: 'i' } }
      ]
    };

    if (subject) {
      filter['expertise.subject'] = { $regex: subject, $options: 'i' };
    }

    if (role) {
      filter.role = role;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('firstName lastName username avatar bio role expertise statistics lastActiveAt')
        .sort({ lastActiveAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      User.countDocuments(filter)
    ]);

    res.json({
      users: users.map(user => ({
        ...user,
        overallExpertise: user.expertise.length > 0
          ? Math.round(user.expertise.reduce((sum, exp) => sum + exp.level, 0) / user.expertise.length)
          : 0
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({
      error: 'Failed to search users'
    });
  }
});

module.exports = router;
