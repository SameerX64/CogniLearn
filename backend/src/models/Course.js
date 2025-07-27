const mongoose = require('mongoose');

const lessonSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: String,
  content: String,
  videoUrl: String,
  duration: Number, // in minutes
  order: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    enum: ['video', 'text', 'interactive', 'quiz'],
    default: 'text'
  },
  resources: [{
    title: String,
    url: String,
    type: {
      type: String,
      enum: ['pdf', 'link', 'video', 'article']
    }
  }]
});

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  shortDescription: {
    type: String,
    maxlength: 200
  },
  instructor: {
    name: String,
    bio: String,
    avatar: String,
    expertise: [String]
  },
  category: {
    type: String,
    required: true,
    enum: [
      'Programming',
      'Data Science',
      'Machine Learning',
      'Web Development',
      'Mobile Development',
      'DevOps',
      'Cybersecurity',
      'Cloud Computing',
      'Artificial Intelligence',
      'Database',
      'UI/UX Design',
      'Project Management',
      'Business',
      'Mathematics',
      'Physics',
      'Chemistry',
      'Biology',
      'Other'
    ]
  },
  subcategory: String,
  level: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    required: true
  },
  complexity: {
    type: Number,
    min: 1,
    max: 9,
    default: 1
  },
  thumbnail: String,
  coverImage: String,
  price: {
    type: Number,
    default: 0
  },
  currency: {
    type: String,
    default: 'USD'
  },
  duration: {
    type: Number, // in minutes
    required: true
  },
  estimatedCompletionTime: String, // e.g., "4 weeks", "2 months"
  language: {
    type: String,
    default: 'English'
  },
  subtitles: [String],
  lessons: [lessonSchema],
  prerequisites: [String],
  learningOutcomes: [String],
  skills: [String],
  tags: [String],
  ratings: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    },
    distribution: {
      five: { type: Number, default: 0 },
      four: { type: Number, default: 0 },
      three: { type: Number, default: 0 },
      two: { type: Number, default: 0 },
      one: { type: Number, default: 0 }
    }
  },
  reviews: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  enrollment: {
    count: {
      type: Number,
      default: 0
    },
    limit: Number // null means unlimited
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  metadata: {
    totalQuizzes: {
      type: Number,
      default: 0
    },
    totalAssignments: {
      type: Number,
      default: 0
    },
    certificateAvailable: {
      type: Boolean,
      default: false
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  },
  aiGenerated: {
    type: Boolean,
    default: false
  },
  originalSource: {
    platform: String, // e.g., 'YouTube', 'Wikipedia', 'Research Paper'
    url: String,
    extractedAt: Date
  }
}, {
  timestamps: true
});

// Virtual for total lessons count
courseSchema.virtual('totalLessons').get(function() {
  return this.lessons.length;
});

// Calculate average lesson duration
courseSchema.virtual('averageLessonDuration').get(function() {
  if (this.lessons.length === 0) return 0;
  const totalDuration = this.lessons.reduce((sum, lesson) => sum + (lesson.duration || 0), 0);
  return Math.round(totalDuration / this.lessons.length);
});

// Method to add a review and update ratings
courseSchema.methods.addReview = function(userId, rating, comment) {
  // Check if user already reviewed
  const existingReviewIndex = this.reviews.findIndex(
    review => review.userId.toString() === userId.toString()
  );

  if (existingReviewIndex !== -1) {
    // Update existing review
    const oldRating = this.reviews[existingReviewIndex].rating;
    this.reviews[existingReviewIndex].rating = rating;
    this.reviews[existingReviewIndex].comment = comment;
    this.reviews[existingReviewIndex].createdAt = new Date();
    
    // Update rating distribution
    this.ratings.distribution[this._getRatingKey(oldRating)]--;
    this.ratings.distribution[this._getRatingKey(rating)]++;
  } else {
    // Add new review
    this.reviews.push({ userId, rating, comment });
    this.ratings.count++;
    this.ratings.distribution[this._getRatingKey(rating)]++;
  }

  // Recalculate average
  this._updateAverageRating();
  return this.save();
};

courseSchema.methods._getRatingKey = function(rating) {
  const keys = { 1: 'one', 2: 'two', 3: 'three', 4: 'four', 5: 'five' };
  return keys[rating];
};

courseSchema.methods._updateAverageRating = function() {
  if (this.ratings.count === 0) {
    this.ratings.average = 0;
    return;
  }

  const total = (
    this.ratings.distribution.one * 1 +
    this.ratings.distribution.two * 2 +
    this.ratings.distribution.three * 3 +
    this.ratings.distribution.four * 4 +
    this.ratings.distribution.five * 5
  );

  this.ratings.average = Math.round((total / this.ratings.count) * 10) / 10;
};

// Method to increment enrollment count
courseSchema.methods.incrementEnrollment = function() {
  this.enrollment.count++;
  return this.save();
};

// Indexes for performance
courseSchema.index({ category: 1, level: 1 });
courseSchema.index({ 'ratings.average': -1 });
courseSchema.index({ 'enrollment.count': -1 });
courseSchema.index({ tags: 1 });
courseSchema.index({ status: 1, isPublic: 1 });
courseSchema.index({ complexity: 1 });
courseSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Course', courseSchema);
