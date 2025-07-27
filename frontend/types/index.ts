// User types
export interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName?: string;
  avatar?: string;
  bio?: string;
  role: 'student' | 'mentor' | 'admin';
  expertise: Expertise[];
  interests: string[];
  learningGoals: string[];
  preferences: UserPreferences;
  achievements: Achievement[];
  statistics: UserStatistics;
  isEmailVerified: boolean;
  overallExpertise?: number;
  profileCompleteness?: number;
}

export interface Expertise {
  subject: string;
  level: number; // 1-10
}

export interface UserPreferences {
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced';
  learningStyle: 'visual' | 'auditory' | 'kinesthetic' | 'reading';
  pace: 'slow' | 'normal' | 'fast';
}

export interface Achievement {
  title: string;
  description: string;
  badgeIcon: string;
  earnedAt: string;
}

export interface UserStatistics {
  totalCoursesCompleted: number;
  totalQuizzesTaken: number;
  averageQuizScore: number;
  totalLearningTime: number;
  currentStreak: number;
  longestStreak: number;
}

// Course types
export interface Course {
  id: string;
  title: string;
  description: string;
  shortDescription?: string;
  instructor: Instructor;
  category: string;
  subcategory?: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  complexity: number; // 1-9
  thumbnail?: string;
  coverImage?: string;
  price: number;
  currency: string;
  duration: number; // in minutes
  estimatedCompletionTime?: string;
  language: string;
  lessons: Lesson[];
  prerequisites: string[];
  learningOutcomes: string[];
  skills: string[];
  tags: string[];
  ratings: CourseRatings;
  enrollment: {
    count: number;
    limit?: number;
  };
  isEnrolled?: boolean;
  userProgress?: number;
  isFeatured: boolean;
  aiGenerated?: boolean;
}

export interface Instructor {
  name: string;
  bio?: string;
  avatar?: string;
  expertise: string[];
}

export interface Lesson {
  id: string;
  title: string;
  description?: string;
  content?: string;
  videoUrl?: string;
  duration: number;
  order: number;
  type: 'video' | 'text' | 'interactive' | 'quiz';
  resources: Resource[];
}

export interface Resource {
  title: string;
  url: string;
  type: 'pdf' | 'link' | 'video' | 'article';
}

export interface CourseRatings {
  average: number;
  count: number;
  distribution: {
    five: number;
    four: number;
    three: number;
    two: number;
    one: number;
  };
}

// Quiz types
export interface Quiz {
  id: string;
  title: string;
  description?: string;
  subject: string;
  category: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  difficulty: 'easy' | 'medium' | 'hard';
  questions: Question[];
  timeLimit?: number; // in minutes
  passingScore: number; // percentage
  maxAttempts?: number;
  settings: QuizSettings;
  courseId?: string;
  isPublic: boolean;
  aiGenerated?: boolean;
  userAttempts?: number;
  bestScore?: number;
  canAttempt?: boolean;
  totalQuestions?: number;
  estimatedDuration?: number;
}

export interface Question {
  id: string;
  question: string;
  type: 'multiple-choice' | 'true-false' | 'short-answer' | 'essay';
  options?: QuestionOption[];
  correctAnswer?: string;
  explanation?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
  tags: string[];
  order: number;
}

export interface QuestionOption {
  text: string;
  isCorrect?: boolean;
}

export interface QuizSettings {
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  showCorrectAnswers: boolean;
  showExplanations: boolean;
  allowReview: boolean;
  instantFeedback: boolean;
}

export interface QuizAttempt {
  quizId: string;
  score: number;
  completedAt: string;
  timeSpent: number;
}

export interface QuizResult {
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  earnedPoints: number;
  totalPoints: number;
  passed: boolean;
  timeSpent: number;
  submittedAt: string;
  quizTitle: string;
  detailedResults?: QuestionResult[];
}

export interface QuestionResult {
  question: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  explanation?: string;
  points: number;
}

// Research Analysis types
export interface ResearchAnalysis {
  id: string;
  title: string;
  source?: {
    type: string;
    url?: string;
  };
  analysis: {
    summary: string;
    keyPoints: string[];
    methodology: string;
    findings: string[];
    limitations: string[];
    implications: string[];
    relatedTopics: string[];
    complexity: number;
    readingLevel: string;
  };
  generatedQuestions: GeneratedQuestion[];
  tags: string[];
  createdAt: string;
  isPublic: boolean;
}

export interface GeneratedQuestion {
  question: string;
  type: string;
  difficulty: string;
}

// Performance types
export interface PerformanceDashboard {
  overview: {
    totalCoursesEnrolled: number;
    completedCourses: number;
    inProgressCourses: number;
    averageCourseProgress: number;
    totalQuizzesTaken: number;
    averageQuizScore: number;
    totalLearningTime: number;
    currentStreak: number;
    longestStreak: number;
  };
  recentActivity: {
    recentQuizzes: QuizAttempt[];
    recentCourses: EnrolledCourse[];
  };
  subjectPerformance: Record<string, {
    total: number;
    average: number;
  }>;
  achievements: Achievement[];
  learningGoals: string[];
  expertiseLevel: number;
}

export interface EnrolledCourse {
  courseId: string;
  title: string;
  progress: number;
  status: 'enrolled' | 'completed' | 'dropped';
  enrolledAt: string;
}

// Mentor types
export interface Mentor {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  avatar?: string;
  bio?: string;
  expertise: Expertise[];
  statistics: {
    coursesCompleted: number;
    averageQuizScore: number;
    streak: number;
  };
  overallExpertise: number;
  subjectMatch: string[];
  score: number;
  lastActiveAt: string;
}

// API Response types
export interface ApiResponse<T> {
  data?: T;
  message?: string;
  error?: string;
  success?: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Form types
export interface LoginForm {
  login: string; // email or username
  password: string;
}

export interface RegisterForm {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
}

export interface ProfileUpdateForm {
  firstName: string;
  lastName: string;
  bio: string;
  interests: string[];
  learningGoals: string[];
  preferences: UserPreferences;
}

// UI Component types
export interface NavItem {
  title: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
  disabled?: boolean;
  external?: boolean;
}

export interface FeatureCard {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
}

// Filter and search types
export interface CourseFilters {
  category?: string;
  level?: string;
  search?: string;
  minRating?: number;
  maxPrice?: number;
  featured?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface QuizFilters {
  subject?: string;
  category?: string;
  level?: string;
  difficulty?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
