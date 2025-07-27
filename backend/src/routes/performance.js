const express = require('express');
const User = require('../models/User');
const Quiz = require('../models/Quiz');
const Course = require('../models/Course');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Get user performance dashboard
router.get('/dashboard', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('courses.courseId', 'title category level')
      .lean();

    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    // Calculate course statistics
    const enrolledCourses = user.courses.length;
    const completedCourses = user.courses.filter(c => c.status === 'completed').length;
    const inProgressCourses = user.courses.filter(c => c.status === 'enrolled').length;
    const averageProgress = enrolledCourses > 0 
      ? Math.round(user.courses.reduce((sum, c) => sum + c.progress, 0) / enrolledCourses)
      : 0;

    // Calculate quiz statistics
    const totalQuizzes = user.quizzes.length;
    const averageScore = user.statistics.averageQuizScore;
    const recentQuizzes = user.quizzes
      .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
      .slice(0, 5);

    // Calculate learning streak
    const today = new Date();
    const oneDay = 24 * 60 * 60 * 1000;
    let currentStreak = 0;
    let checkDate = new Date(today);

    // Get all learning activities (course progress updates, quiz completions)
    const learningDates = [
      ...user.courses.map(c => new Date(c.enrolledAt)),
      ...user.quizzes.map(q => new Date(q.completedAt))
    ].sort((a, b) => b - a);

    // Calculate streak
    for (let i = 0; i < learningDates.length; i++) {
      const activityDate = new Date(learningDates[i]);
      const daysDiff = Math.floor((checkDate - activityDate) / oneDay);
      
      if (daysDiff <= 1) {
        currentStreak++;
        checkDate = activityDate;
      } else {
        break;
      }
    }

    // Update user streak if it's higher
    if (currentStreak > user.statistics.longestStreak) {
      user.statistics.longestStreak = currentStreak;
      user.statistics.currentStreak = currentStreak;
      await user.save();
    }

    // Get subject-wise performance
    const subjectPerformance = {};
    user.quizzes.forEach(quiz => {
      // This would need quiz subject info - simplified for now
      const subject = 'General'; // Would get from quiz.subject
      if (!subjectPerformance[subject]) {
        subjectPerformance[subject] = { total: 0, scores: [] };
      }
      subjectPerformance[subject].total++;
      subjectPerformance[subject].scores.push(quiz.score);
    });

    Object.keys(subjectPerformance).forEach(subject => {
      const data = subjectPerformance[subject];
      data.average = Math.round(
        data.scores.reduce((sum, score) => sum + score, 0) / data.scores.length
      );
    });

    res.json({
      overview: {
        totalCoursesEnrolled: enrolledCourses,
        completedCourses,
        inProgressCourses,
        averageCourseProgress: averageProgress,
        totalQuizzesTaken: totalQuizzes,
        averageQuizScore: averageScore,
        totalLearningTime: user.statistics.totalLearningTime,
        currentStreak: currentStreak,
        longestStreak: user.statistics.longestStreak
      },
      recentActivity: {
        recentQuizzes: recentQuizzes.map(quiz => ({
          quizId: quiz.quizId,
          score: quiz.score,
          completedAt: quiz.completedAt,
          timeSpent: quiz.timeSpent
        })),
        recentCourses: user.courses
          .sort((a, b) => new Date(b.enrolledAt) - new Date(a.enrolledAt))
          .slice(0, 5)
          .map(course => ({
            courseId: course.courseId._id,
            title: course.courseId.title,
            progress: course.progress,
            status: course.status,
            enrolledAt: course.enrolledAt
          }))
      },
      subjectPerformance,
      achievements: user.achievements
        .sort((a, b) => new Date(b.earnedAt) - new Date(a.earnedAt))
        .slice(0, 10),
      learningGoals: user.learningGoals,
      expertiseLevel: user.overallExpertise
    });
  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({
      error: 'Failed to fetch performance dashboard'
    });
  }
});

// Get detailed learning progress
router.get('/progress', auth, async (req, res) => {
  try {
    const { timeframe = '30d', subject } = req.query;
    
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    // Calculate date range
    const now = new Date();
    let startDate;
    
    switch (timeframe) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Filter activities by date range
    const recentQuizzes = user.quizzes.filter(
      quiz => new Date(quiz.completedAt) >= startDate
    );

    const recentCourseProgress = user.courses.filter(
      course => new Date(course.enrolledAt) >= startDate
    );

    // Calculate daily progress
    const dailyProgress = {};
    const days = Math.ceil((now - startDate) / (24 * 60 * 60 * 1000));
    
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      dailyProgress[dateStr] = {
        quizzes: 0,
        courseProgress: 0,
        learningTime: 0,
        score: 0
      };
    }

    // Populate daily data
    recentQuizzes.forEach(quiz => {
      const dateStr = new Date(quiz.completedAt).toISOString().split('T')[0];
      if (dailyProgress[dateStr]) {
        dailyProgress[dateStr].quizzes++;
        dailyProgress[dateStr].learningTime += quiz.timeSpent || 0;
        dailyProgress[dateStr].score = (
          dailyProgress[dateStr].score + quiz.score
        ) / dailyProgress[dateStr].quizzes;
      }
    });

    // Calculate skill progression
    const skillProgression = {};
    user.expertise.forEach(exp => {
      skillProgression[exp.subject] = {
        currentLevel: exp.level,
        recentQuizzes: recentQuizzes.filter(q => {
          // Would need to match quiz subjects - simplified
          return true;
        }).length,
        averageScore: recentQuizzes.length > 0 
          ? Math.round(recentQuizzes.reduce((sum, q) => sum + q.score, 0) / recentQuizzes.length)
          : 0
      };
    });

    res.json({
      timeframe,
      dateRange: {
        start: startDate,
        end: now
      },
      summary: {
        totalQuizzes: recentQuizzes.length,
        averageScore: recentQuizzes.length > 0 
          ? Math.round(recentQuizzes.reduce((sum, q) => sum + q.score, 0) / recentQuizzes.length)
          : 0,
        totalLearningTime: recentQuizzes.reduce((sum, q) => sum + (q.timeSpent || 0), 0),
        coursesProgressed: recentCourseProgress.length
      },
      dailyProgress,
      skillProgression,
      trends: {
        quizPerformance: recentQuizzes.map(quiz => ({
          date: quiz.completedAt,
          score: quiz.score,
          timeSpent: quiz.timeSpent
        })).sort((a, b) => new Date(a.date) - new Date(b.date))
      }
    });
  } catch (error) {
    console.error('Get progress error:', error);
    res.status(500).json({
      error: 'Failed to fetch learning progress'
    });
  }
});

// Get achievement history
router.get('/achievements', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    const achievements = user.achievements.sort(
      (a, b) => new Date(b.earnedAt) - new Date(a.earnedAt)
    );

    // Calculate achievement statistics
    const achievementStats = {
      total: achievements.length,
      thisMonth: achievements.filter(
        a => new Date(a.earnedAt) >= new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      ).length,
      thisWeek: achievements.filter(
        a => new Date(a.earnedAt) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      ).length
    };

    res.json({
      achievements,
      statistics: achievementStats
    });
  } catch (error) {
    console.error('Get achievements error:', error);
    res.status(500).json({
      error: 'Failed to fetch achievements'
    });
  }
});

// Get performance comparison with peers
router.get('/comparison', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    // Get users with similar interests/expertise for comparison
    const similarUsers = await User.find({
      _id: { $ne: user._id },
      $or: [
        { interests: { $in: user.interests } },
        { 'expertise.subject': { $in: user.expertise.map(e => e.subject) } }
      ]
    })
    .select('statistics expertise')
    .limit(100)
    .lean();

    if (similarUsers.length === 0) {
      return res.json({
        message: 'No similar users found for comparison',
        comparison: null
      });
    }

    // Calculate peer averages
    const peerStats = {
      averageQuizScore: Math.round(
        similarUsers.reduce((sum, u) => sum + u.statistics.averageQuizScore, 0) / similarUsers.length
      ),
      averageCoursesCompleted: Math.round(
        similarUsers.reduce((sum, u) => sum + u.statistics.totalCoursesCompleted, 0) / similarUsers.length
      ),
      averageLearningTime: Math.round(
        similarUsers.reduce((sum, u) => sum + u.statistics.totalLearningTime, 0) / similarUsers.length
      ),
      averageStreak: Math.round(
        similarUsers.reduce((sum, u) => sum + u.statistics.longestStreak, 0) / similarUsers.length
      )
    };

    // Calculate user's percentile
    const calculatePercentile = (userValue, peerValues) => {
      const sorted = peerValues.sort((a, b) => a - b);
      const below = sorted.filter(val => val < userValue).length;
      return Math.round((below / sorted.length) * 100);
    };

    const comparison = {
      user: {
        averageQuizScore: user.statistics.averageQuizScore,
        totalCoursesCompleted: user.statistics.totalCoursesCompleted,
        totalLearningTime: user.statistics.totalLearningTime,
        longestStreak: user.statistics.longestStreak
      },
      peers: peerStats,
      percentiles: {
        quizScore: calculatePercentile(
          user.statistics.averageQuizScore,
          similarUsers.map(u => u.statistics.averageQuizScore)
        ),
        coursesCompleted: calculatePercentile(
          user.statistics.totalCoursesCompleted,
          similarUsers.map(u => u.statistics.totalCoursesCompleted)
        ),
        learningTime: calculatePercentile(
          user.statistics.totalLearningTime,
          similarUsers.map(u => u.statistics.totalLearningTime)
        ),
        streak: calculatePercentile(
          user.statistics.longestStreak,
          similarUsers.map(u => u.statistics.longestStreak)
        )
      },
      peerCount: similarUsers.length
    };

    res.json({ comparison });
  } catch (error) {
    console.error('Get comparison error:', error);
    res.status(500).json({
      error: 'Failed to fetch performance comparison'
    });
  }
});

module.exports = router;
