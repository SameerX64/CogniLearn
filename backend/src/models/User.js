const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  avatar: {
    type: String,
    default: null
  },
  bio: {
    type: String,
    maxlength: 500,
    default: ''
  },
  expertise: [{
    subject: String,
    level: {
      type: Number,
      min: 1,
      max: 10,
      default: 1
    }
  }],
  interests: [String],
  learningGoals: [String],
  preferences: {
    difficultyLevel: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner'
    },
    learningStyle: {
      type: String,
      enum: ['visual', 'auditory', 'kinesthetic', 'reading'],
      default: 'visual'
    },
    pace: {
      type: String,
      enum: ['slow', 'normal', 'fast'],
      default: 'normal'
    }
  },
  courses: [{
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course'
    },
    enrolledAt: {
      type: Date,
      default: Date.now
    },
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    status: {
      type: String,
      enum: ['enrolled', 'completed', 'dropped'],
      default: 'enrolled'
    }
  }],
  quizzes: [{
    quizId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quiz'
    },
    score: Number,
    completedAt: Date,
    timeSpent: Number // in minutes
  }],
  achievements: [{
    title: String,
    description: String,
    badgeIcon: String,
    earnedAt: {
      type: Date,
      default: Date.now
    }
  }],
  statistics: {
    totalCoursesCompleted: {
      type: Number,
      default: 0
    },
    totalQuizzesTaken: {
      type: Number,
      default: 0
    },
    averageQuizScore: {
      type: Number,
      default: 0
    },
    totalLearningTime: {
      type: Number,
      default: 0 // in minutes
    },
    currentStreak: {
      type: Number,
      default: 0
    },
    longestStreak: {
      type: Number,
      default: 0
    }
  },
  lastActiveAt: {
    type: Date,
    default: Date.now
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  role: {
    type: String,
    enum: ['student', 'mentor', 'admin'],
    default: 'student'
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Get user's full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Update last active timestamp
userSchema.methods.updateLastActive = function() {
  this.lastActiveAt = new Date();
  return this.save();
};

// Add achievement
userSchema.methods.addAchievement = function(achievement) {
  this.achievements.push(achievement);
  return this.save();
};

// Calculate overall expertise level
userSchema.virtual('overallExpertise').get(function() {
  if (this.expertise.length === 0) return 0;
  const total = this.expertise.reduce((sum, exp) => sum + exp.level, 0);
  return Math.round(total / this.expertise.length);
});

// Indexes for performance
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ 'expertise.subject': 1 });
userSchema.index({ lastActiveAt: -1 });

module.exports = mongoose.model('User', userSchema);
