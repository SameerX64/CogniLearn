const mongoose = require('mongoose');

const quizAttemptSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  quizId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz',
    required: true
  },
  answers: [{
    questionId: {
      type: String,
      required: true
    },
    selectedAnswer: {
      type: String,
      required: true
    },
    isCorrect: {
      type: Boolean,
      required: true
    },
    timeSpent: {
      type: Number, // in seconds
      default: 0
    }
  }],
  score: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  totalQuestions: {
    type: Number,
    required: true,
    min: 1
  },
  correctAnswers: {
    type: Number,
    required: true,
    min: 0
  },
  timeSpent: {
    type: Number, // total time in seconds
    default: 0
  },
  completed: {
    type: Boolean,
    default: false
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date,
    default: null
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  category: {
    type: String,
    default: 'general'
  }
}, {
  timestamps: true
});

// Indexes for better query performance
quizAttemptSchema.index({ userId: 1, quizId: 1 });
quizAttemptSchema.index({ userId: 1, createdAt: -1 });
quizAttemptSchema.index({ quizId: 1, score: -1 });

// Static methods
quizAttemptSchema.statics.getBestAttempt = function(userId, quizId) {
  return this.findOne({ userId, quizId, completed: true })
    .sort({ score: -1, createdAt: -1 });
};

quizAttemptSchema.statics.getLatestAttempt = function(userId, quizId) {
  return this.findOne({ userId, quizId })
    .sort({ createdAt: -1 });
};

quizAttemptSchema.statics.getUserStats = async function(userId) {
  const pipeline = [
    { $match: { userId: mongoose.Types.ObjectId(userId), completed: true } },
    {
      $group: {
        _id: null,
        totalAttempts: { $sum: 1 },
        averageScore: { $avg: '$score' },
        bestScore: { $max: '$score' },
        totalTimeSpent: { $sum: '$timeSpent' },
        totalCorrectAnswers: { $sum: '$correctAnswers' },
        totalQuestions: { $sum: '$totalQuestions' }
      }
    }
  ];

  const result = await this.aggregate(pipeline);
  
  if (result.length === 0) {
    return {
      totalAttempts: 0,
      averageScore: 0,
      bestScore: 0,
      totalTimeSpent: 0,
      accuracy: 0
    };
  }

  const stats = result[0];
  return {
    totalAttempts: stats.totalAttempts,
    averageScore: Math.round(stats.averageScore * 100) / 100,
    bestScore: stats.bestScore,
    totalTimeSpent: stats.totalTimeSpent,
    accuracy: stats.totalQuestions > 0 ? 
      Math.round((stats.totalCorrectAnswers / stats.totalQuestions) * 100) : 0
  };
};

quizAttemptSchema.statics.getLeaderboard = function(quizId, limit = 10) {
  return this.find({ quizId, completed: true })
    .populate('userId', 'username firstName lastName')
    .sort({ score: -1, timeSpent: 1 })
    .limit(limit);
};

// Instance methods
quizAttemptSchema.methods.calculateScore = function() {
  if (this.totalQuestions === 0) return 0;
  
  this.correctAnswers = this.answers.filter(answer => answer.isCorrect).length;
  this.score = Math.round((this.correctAnswers / this.totalQuestions) * 100);
  
  return this.score;
};

quizAttemptSchema.methods.markCompleted = function() {
  this.completed = true;
  this.completedAt = new Date();
  return this.save();
};

// Pre-save middleware
quizAttemptSchema.pre('save', function(next) {
  if (this.isModified('answers') || this.isNew) {
    this.calculateScore();
  }
  next();
});

const QuizAttempt = mongoose.model('QuizAttempt', quizAttemptSchema);

module.exports = QuizAttempt;
