const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['multiple-choice', 'true-false', 'short-answer', 'essay'],
    default: 'multiple-choice'
  },
  options: [{
    text: String,
    isCorrect: Boolean
  }],
  correctAnswer: String, // For short-answer and essay questions
  explanation: String,
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  points: {
    type: Number,
    default: 1
  },
  tags: [String],
  order: {
    type: Number,
    required: true
  }
});

const quizSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: String,
  subject: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  level: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    required: true
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  questions: [questionSchema],
  timeLimit: {
    type: Number, // in minutes
    default: null // null means no time limit
  },
  passingScore: {
    type: Number,
    default: 70, // percentage
    min: 0,
    max: 100
  },
  maxAttempts: {
    type: Number,
    default: null // null means unlimited attempts
  },
  settings: {
    shuffleQuestions: {
      type: Boolean,
      default: false
    },
    shuffleOptions: {
      type: Boolean,
      default: true
    },
    showCorrectAnswers: {
      type: Boolean,
      default: true
    },
    showExplanations: {
      type: Boolean,
      default: true
    },
    allowReview: {
      type: Boolean,
      default: true
    },
    instantFeedback: {
      type: Boolean,
      default: false
    }
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    default: null
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  },
  aiGenerated: {
    type: Boolean,
    default: false
  },
  sourceContent: {
    text: String,
    url: String,
    type: String // 'wikipedia', 'research-paper', 'custom'
  },
  statistics: {
    totalAttempts: {
      type: Number,
      default: 0
    },
    averageScore: {
      type: Number,
      default: 0
    },
    averageTimeSpent: {
      type: Number,
      default: 0 // in minutes
    },
    passRate: {
      type: Number,
      default: 0 // percentage
    }
  },
  tags: [String]
}, {
  timestamps: true
});

// Virtual for total questions count
quizSchema.virtual('totalQuestions').get(function() {
  return this.questions.length;
});

// Virtual for total points
quizSchema.virtual('totalPoints').get(function() {
  return this.questions.reduce((sum, question) => sum + question.points, 0);
});

// Calculate estimated duration based on question count and type
quizSchema.virtual('estimatedDuration').get(function() {
  let minutes = 0;
  this.questions.forEach(question => {
    switch (question.type) {
      case 'multiple-choice':
      case 'true-false':
        minutes += 1; // 1 minute per MC/TF question
        break;
      case 'short-answer':
        minutes += 2; // 2 minutes per short answer
        break;
      case 'essay':
        minutes += 5; // 5 minutes per essay question
        break;
      default:
        minutes += 1;
    }
  });
  return Math.max(minutes, 5); // Minimum 5 minutes
});

// Method to calculate score for a submission
quizSchema.methods.calculateScore = function(answers) {
  let correctAnswers = 0;
  let totalPoints = 0;
  let earnedPoints = 0;

  this.questions.forEach((question, index) => {
    totalPoints += question.points;
    const userAnswer = answers[index];

    if (question.type === 'multiple-choice' || question.type === 'true-false') {
      const correctOption = question.options.find(opt => opt.isCorrect);
      if (correctOption && userAnswer === correctOption.text) {
        correctAnswers++;
        earnedPoints += question.points;
      }
    } else if (question.type === 'short-answer') {
      // Simple string comparison (case-insensitive)
      if (userAnswer && userAnswer.toLowerCase().trim() === question.correctAnswer.toLowerCase().trim()) {
        correctAnswers++;
        earnedPoints += question.points;
      }
    }
    // Essay questions would need manual grading
  });

  const percentage = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
  
  return {
    score: percentage,
    correctAnswers,
    totalQuestions: this.questions.length,
    earnedPoints,
    totalPoints,
    passed: percentage >= this.passingScore
  };
};

// Method to update statistics after a quiz attempt
quizSchema.methods.updateStatistics = function(score, timeSpent, passed) {
  this.statistics.totalAttempts++;
  
  // Update average score
  const oldAverage = this.statistics.averageScore;
  const attempts = this.statistics.totalAttempts;
  this.statistics.averageScore = Math.round(
    ((oldAverage * (attempts - 1)) + score) / attempts
  );

  // Update average time spent
  const oldTimeAverage = this.statistics.averageTimeSpent;
  this.statistics.averageTimeSpent = Math.round(
    ((oldTimeAverage * (attempts - 1)) + timeSpent) / attempts
  );

  // Update pass rate
  const passedAttempts = passed ? 1 : 0;
  // This is simplified - in reality, you'd need to track passed attempts separately
  this.statistics.passRate = Math.round(
    (this.statistics.passRate * (attempts - 1) + (passed ? 100 : 0)) / attempts
  );

  return this.save();
};

// Indexes for performance
quizSchema.index({ subject: 1, level: 1 });
quizSchema.index({ category: 1 });
quizSchema.index({ 'statistics.averageScore': -1 });
quizSchema.index({ createdBy: 1 });
quizSchema.index({ courseId: 1 });
quizSchema.index({ status: 1, isPublic: 1 });
quizSchema.index({ tags: 1 });
quizSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Quiz', quizSchema);
