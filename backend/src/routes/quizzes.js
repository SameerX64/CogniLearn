const express = require('express');
const Quiz = require('../models/Quiz');
const User = require('../models/User');
const { auth, optionalAuth } = require('../middleware/auth');
const axios = require('axios');

const router = express.Router();

// AI service URL
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

// Model to track quiz attempts
const QuizAttempt = require('../models/QuizAttempt');

// Get all quizzes with filtering and pagination
router.get('/', optionalAuth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      subject,
      category,
      level,
      difficulty,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = { status: 'published', isPublic: true };

    if (subject) filter.subject = subject;
    if (category) filter.category = category;
    if (level) filter.level = level;
    if (difficulty) filter.difficulty = difficulty;

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [quizzes, total] = await Promise.all([
      Quiz.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .select('-questions.correctAnswer -questions.explanation') // Hide answers for listing
        .lean(),
      Quiz.countDocuments(filter)
    ]);

    // Add attempt count if user is authenticated
    if (req.user) {
      const userQuizAttempts = req.user.quizzes || [];
      quizzes.forEach(quiz => {
        const attempts = userQuizAttempts.filter(
          attempt => attempt.quizId.toString() === quiz._id.toString()
        );
        quiz.userAttempts = attempts.length;
        quiz.bestScore = attempts.length > 0 
          ? Math.max(...attempts.map(a => a.score)) 
          : null;
      });
    }

    res.json({
      quizzes,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get quizzes error:', error);
    res.status(500).json({
      error: 'Failed to fetch quizzes'
    });
  }
});

// Generate AI quiz
router.post('/generate', auth, async (req, res) => {
  try {
    const {
      topic,
      difficulty = 'medium',
      questionCount = 10,
      type = 'multiple-choice',
      source = 'general'
    } = req.body;

    if (!topic) {
      return res.status(400).json({
        error: 'Topic is required for quiz generation'
      });
    }

    try {
      // Call AI service to generate quiz
      const aiResponse = await axios.post(`${AI_SERVICE_URL}/api/generate-quiz`, {
        topic,
        difficulty,
        questionCount,
        type,
        source
      });

      const generatedQuiz = aiResponse.data;

      // Create quiz in database
      const quiz = new Quiz({
        title: generatedQuiz.title || `${topic} Quiz`,
        description: generatedQuiz.description || `AI-generated quiz on ${topic}`,
        subject: topic,
        category: generatedQuiz.category || 'General',
        level: difficulty === 'easy' ? 'beginner' : difficulty === 'hard' ? 'advanced' : 'intermediate',
        difficulty,
        questions: generatedQuiz.questions.map((q, index) => ({
          ...q,
          order: index + 1
        })),
        aiGenerated: true,
        sourceContent: {
          text: generatedQuiz.sourceText,
          type: source
        },
        createdBy: req.user._id,
        status: 'published',
        tags: [topic, difficulty, 'ai-generated']
      });

      await quiz.save();

      res.json({
        message: 'Quiz generated successfully',
        quiz: {
          id: quiz._id,
          title: quiz.title,
          description: quiz.description,
          subject: quiz.subject,
          level: quiz.level,
          difficulty: quiz.difficulty,
          totalQuestions: quiz.totalQuestions,
          estimatedDuration: quiz.estimatedDuration,
          aiGenerated: quiz.aiGenerated
        }
      });
    } catch (aiError) {
      console.log('AI service unavailable, using fallback generation');
      
      // Fallback: Create a simple quiz structure
      const fallbackQuiz = new Quiz({
        title: `${topic} Quiz`,
        description: `Quiz on ${topic}`,
        subject: topic,
        category: 'General',
        level: difficulty === 'easy' ? 'beginner' : difficulty === 'hard' ? 'advanced' : 'intermediate',
        difficulty,
        questions: [
          {
            question: `What is a key concept in ${topic}?`,
            type: 'multiple-choice',
            options: [
              { text: 'Option A', isCorrect: true },
              { text: 'Option B', isCorrect: false },
              { text: 'Option C', isCorrect: false },
              { text: 'Option D', isCorrect: false }
            ],
            explanation: 'This is a placeholder question. Please add real content.',
            difficulty,
            points: 1,
            order: 1
          }
        ],
        aiGenerated: false,
        createdBy: req.user._id,
        status: 'draft', // Set as draft since it's a placeholder
        tags: [topic, difficulty, 'placeholder']
      });

      await fallbackQuiz.save();

      res.json({
        message: 'Quiz template created (AI service unavailable)',
        quiz: {
          id: fallbackQuiz._id,
          title: fallbackQuiz.title,
          description: fallbackQuiz.description,
          subject: fallbackQuiz.subject,
          level: fallbackQuiz.level,
          difficulty: fallbackQuiz.difficulty,
          totalQuestions: fallbackQuiz.totalQuestions,
          estimatedDuration: fallbackQuiz.estimatedDuration,
          aiGenerated: fallbackQuiz.aiGenerated,
          status: fallbackQuiz.status
        }
      });
    }
  } catch (error) {
    console.error('Generate quiz error:', error);
    res.status(500).json({
      error: 'Failed to generate quiz'
    });
  }
});

// Get quiz by ID
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const quiz = await Quiz.findOne({
      _id: req.params.id,
      status: 'published',
      isPublic: true
    })
    .populate('createdBy', 'firstName lastName username')
    .lean();

    if (!quiz) {
      return res.status(404).json({
        error: 'Quiz not found'
      });
    }

    // Hide correct answers and explanations initially
    const quizForUser = {
      ...quiz,
      questions: quiz.questions.map(q => ({
        _id: q._id,
        question: q.question,
        type: q.type,
        options: q.options.map(opt => ({
          text: opt.text,
          // Don't include isCorrect
        })),
        difficulty: q.difficulty,
        points: q.points,
        order: q.order,
        tags: q.tags
      }))
    };

    // Add user attempt history if authenticated
    if (req.user) {
      const userAttempts = req.user.quizzes.filter(
        attempt => attempt.quizId.toString() === quiz._id.toString()
      );
      
      quizForUser.userAttempts = userAttempts.length;
      quizForUser.bestScore = userAttempts.length > 0 
        ? Math.max(...userAttempts.map(a => a.score)) 
        : null;
      quizForUser.canAttempt = quiz.maxAttempts ? userAttempts.length < quiz.maxAttempts : true;
    }

    res.json({ quiz: quizForUser });
  } catch (error) {
    console.error('Get quiz error:', error);
    res.status(500).json({
      error: 'Failed to fetch quiz'
    });
  }
});

// Submit quiz answers
router.post('/:id/submit', auth, async (req, res) => {
  try {
    const { answers, timeSpent } = req.body;

    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({
        error: 'Answers array is required'
      });
    }

    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) {
      return res.status(404).json({
        error: 'Quiz not found'
      });
    }

    // Check attempt limit
    const user = await User.findById(req.user._id);
    const userAttempts = user.quizzes.filter(
      attempt => attempt.quizId.toString() === quiz._id.toString()
    );

    if (quiz.maxAttempts && userAttempts.length >= quiz.maxAttempts) {
      return res.status(403).json({
        error: 'Maximum attempts reached for this quiz'
      });
    }

    // Calculate score
    const result = quiz.calculateScore(answers);

    // Save attempt to user record
    user.quizzes.push({
      quizId: quiz._id,
      score: result.score,
      completedAt: new Date(),
      timeSpent: timeSpent || 0
    });

    // Update user statistics
    user.statistics.totalQuizzesTaken++;
    const totalQuizzes = user.statistics.totalQuizzesTaken;
    const oldAverage = user.statistics.averageQuizScore;
    user.statistics.averageQuizScore = Math.round(
      ((oldAverage * (totalQuizzes - 1)) + result.score) / totalQuizzes
    );

    await user.save();

    // Update quiz statistics
    await quiz.updateStatistics(result.score, timeSpent || 0, result.passed);

    // Add achievements for quiz performance
    if (result.passed) {
      await user.addAchievement({
        title: 'Quiz Passed',
        description: `Passed "${quiz.title}" with ${result.score}%`,
        badgeIcon: '✅',
        earnedAt: new Date()
      });
    }

    if (result.score === 100) {
      await user.addAchievement({
        title: 'Perfect Score',
        description: `Scored 100% on "${quiz.title}"`,
        badgeIcon: '🎯',
        earnedAt: new Date()
      });
    }

    // Prepare detailed results with correct answers (only after submission)
    const detailedResults = quiz.questions.map((question, index) => ({
      question: question.question,
      userAnswer: answers[index],
      correctAnswer: question.type === 'multiple-choice' || question.type === 'true-false'
        ? question.options.find(opt => opt.isCorrect)?.text
        : question.correctAnswer,
      isCorrect: question.type === 'multiple-choice' || question.type === 'true-false'
        ? question.options.find(opt => opt.isCorrect)?.text === answers[index]
        : answers[index]?.toLowerCase().trim() === question.correctAnswer?.toLowerCase().trim(),
      explanation: question.explanation,
      points: question.points
    }));

    res.json({
      message: 'Quiz submitted successfully',
      result: {
        ...result,
        timeSpent: timeSpent || 0,
        submittedAt: new Date(),
        quizTitle: quiz.title,
        detailedResults: quiz.settings.showCorrectAnswers ? detailedResults : null
      }
    });
  } catch (error) {
    console.error('Submit quiz error:', error);
    res.status(500).json({
      error: 'Failed to submit quiz'
    });
  }
});

// Get quiz results/review - latest attempt
router.get('/:id/results', auth, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) {
      return res.status(404).json({
        error: 'Quiz not found'
      });
    }

    const user = await User.findById(req.user._id);
    const userAttempts = user.quizzes.filter(
      attempt => attempt.quizId.toString() === quiz._id.toString()
    );

    if (userAttempts.length === 0) {
      return res.status(404).json({
        error: 'No attempts found for this quiz'
      });
    }

    const attemptIndex = userAttempts.length - 1; // Latest attempt by default

    if (attemptIndex < 0 || attemptIndex >= userAttempts.length) {
      return res.status(404).json({
        error: 'Attempt not found'
      });
    }

    const attempt = userAttempts[attemptIndex];

    res.json({
      quiz: {
        id: quiz._id,
        title: quiz.title,
        totalQuestions: quiz.totalQuestions,
        totalPoints: quiz.totalPoints
      },
      attempt: {
        score: attempt.score,
        completedAt: attempt.completedAt,
        timeSpent: attempt.timeSpent,
        attemptNumber: attemptIndex + 1,
        totalAttempts: userAttempts.length
      },
      summary: {
        passed: attempt.score >= quiz.passingScore,
        passingScore: quiz.passingScore,
        canRetake: quiz.maxAttempts ? userAttempts.length < quiz.maxAttempts : true,
        remainingAttempts: quiz.maxAttempts ? Math.max(0, quiz.maxAttempts - userAttempts.length) : null
      }
    });
  } catch (error) {
    console.error('Get quiz results error:', error);
    res.status(500).json({
      error: 'Failed to fetch quiz results'
    });
  }
});

// Get quiz results/review - specific attempt
router.get('/:id/results/:attemptIndex', auth, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) {
      return res.status(404).json({
        error: 'Quiz not found'
      });
    }

    const user = await User.findById(req.user._id);
    const userAttempts = user.quizzes.filter(
      attempt => attempt.quizId.toString() === quiz._id.toString()
    );

    if (userAttempts.length === 0) {
      return res.status(404).json({
        error: 'No attempts found for this quiz'
      });
    }

    const attemptIndex = parseInt(req.params.attemptIndex);

    if (attemptIndex < 0 || attemptIndex >= userAttempts.length) {
      return res.status(404).json({
        error: 'Attempt not found'
      });
    }

    const attempt = userAttempts[attemptIndex];

    res.json({
      quiz: {
        id: quiz._id,
        title: quiz.title,
        totalQuestions: quiz.totalQuestions,
        totalPoints: quiz.totalPoints
      },
      attempt: {
        score: attempt.score,
        completedAt: attempt.completedAt,
        timeSpent: attempt.timeSpent,
        attemptNumber: attemptIndex + 1,
        totalAttempts: userAttempts.length
      },
      summary: {
        passed: attempt.score >= quiz.passingScore,
        passingScore: quiz.passingScore,
        canRetake: quiz.maxAttempts ? userAttempts.length < quiz.maxAttempts : true,
        remainingAttempts: quiz.maxAttempts ? Math.max(0, quiz.maxAttempts - userAttempts.length) : null
      }
    });
  } catch (error) {
    console.error('Get quiz results error:', error);
    res.status(500).json({
      error: 'Failed to fetch quiz results'
    });
  }
});

// Get quiz subjects for filtering
router.get('/meta/subjects', async (req, res) => {
  try {
    const subjects = await Quiz.distinct('subject', {
      status: 'published',
      isPublic: true
    });

    res.json({ subjects: subjects.sort() });
  } catch (error) {
    console.error('Get subjects error:', error);
    res.status(500).json({
      error: 'Failed to fetch subjects'
    });
  }
});

module.exports = router;
