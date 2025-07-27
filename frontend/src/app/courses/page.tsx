'use client';

import { useState, useEffect } from 'react';
import AuthenticatedLayout from '../../components/shared/AuthenticatedLayout';

interface User {
  id: number;
  name: string;
  email: string;
  onboardingCompleted: boolean;
  preferences?: {
    studyGoal: string;
    field: string;
    experience: string;
    timeCommitment: string;
    learningStyle: string;
  };
}

export default function Courses() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedVideo, setSelectedVideo] = useState<any>(null);

  useEffect(() => {
    const userData = localStorage.getItem('cognilearn_user');
    if (userData) {
      setCurrentUser(JSON.parse(userData));
    }
  }, []);

  const getCourses = () => {
    const baseCourses = [
      {
        id: 1,
        title: "Introduction to Programming",
        category: "programming",
        difficulty: "Beginner",
        duration: "4 weeks",
        rating: 4.8,
        enrolled: 1250,
        description: "Learn the fundamentals of programming with hands-on exercises",
        instructor: "Dr. Sarah Johnson",
        videos: [
          { id: "1", title: "What is Programming?", duration: "15:30" },
          { id: "2", title: "Setting up Development Environment", duration: "22:45" },
          { id: "3", title: "Your First Program", duration: "18:20" }
        ]
      },
      {
        id: 2,
        title: "Data Science Fundamentals",
        category: "data-science",
        difficulty: "Intermediate",
        duration: "6 weeks",
        rating: 4.9,
        enrolled: 892,
        description: "Master data analysis, visualization, and machine learning basics",
        instructor: "Prof. Michael Chen",
        videos: [
          { id: "4", title: "Introduction to Data Science", duration: "20:15" },
          { id: "5", title: "Data Visualization with Python", duration: "35:40" },
          { id: "6", title: "Statistical Analysis", duration: "28:30" }
        ]
      },
      {
        id: 3,
        title: "Web Development Bootcamp",
        category: "web-dev",
        difficulty: "Beginner",
        duration: "8 weeks",
        rating: 4.7,
        enrolled: 2340,
        description: "Build modern websites with HTML, CSS, JavaScript, and React",
        instructor: "Alex Rodriguez",
        videos: [
          { id: "7", title: "HTML Fundamentals", duration: "25:10" },
          { id: "8", title: "CSS Styling", duration: "30:20" },
          { id: "9", title: "JavaScript Basics", duration: "40:15" }
        ]
      },
      {
        id: 4,
        title: "Business Analytics",
        category: "business",
        difficulty: "Intermediate",
        duration: "5 weeks",
        rating: 4.6,
        enrolled: 756,
        description: "Learn to analyze business data and make data-driven decisions",
        instructor: "Maria Garcia",
        videos: [
          { id: "10", title: "Business Intelligence Basics", duration: "22:30" },
          { id: "11", title: "Excel for Analytics", duration: "45:20" },
          { id: "12", title: "Dashboard Creation", duration: "35:45" }
        ]
      }
    ];

    if (selectedCategory === 'all') return baseCourses;
    return baseCourses.filter(course => course.category === selectedCategory);
  };

  const getRecommendedCourses = () => {
    if (!currentUser?.preferences) return getCourses().slice(0, 2);
    
    const { field, experience } = currentUser.preferences;
    const allCourses = getCourses();
    
    if (field === 'Technology') {
      return allCourses.filter(course => 
        course.category === 'programming' || course.category === 'web-dev'
      );
    } else if (field === 'Business') {
      return allCourses.filter(course => 
        course.category === 'business' || course.category === 'data-science'
      );
    }
    
    return allCourses.slice(0, 2);
  };

  const enrollInCourse = (courseId: number) => {
    alert(`Enrolled in course ${courseId}! Check your dashboard for progress.`);
  };

  const playVideo = (video: any) => {
    setSelectedVideo(video);
  };

  return (
    <AuthenticatedLayout>
      <div className="space-y-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">🎓 Courses</h1>
          <p className="text-xl text-gray-300">
            AI-powered personalized course recommendations
          </p>
        </div>

        {/* Recommended Courses */}
        {currentUser?.preferences && (
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">
              🎯 Recommended for {currentUser.preferences.field}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {getRecommendedCourses().map((course) => (
                <div key={course.id} className="bg-gray-700 rounded-lg p-4 border border-indigo-500">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-semibold text-white">{course.title}</h3>
                    <span className="bg-indigo-600 text-white px-2 py-1 rounded text-xs">
                      Recommended
                    </span>
                  </div>
                  <p className="text-gray-300 text-sm mb-3">{course.description}</p>
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-400">
                      ⭐ {course.rating} • {course.enrolled} students
                    </div>
                    <button 
                      onClick={() => enrollInCourse(course.id)}
                      className="bg-indigo-600 text-white px-4 py-2 rounded text-sm hover:bg-indigo-700"
                    >
                      Start Learning
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Course Filters */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-xl font-semibold text-white mb-4">Browse All Courses</h3>
          <div className="flex flex-wrap gap-3 mb-6">
            {[
              { id: 'all', label: 'All Courses' },
              { id: 'programming', label: 'Programming' },
              { id: 'web-dev', label: 'Web Development' },
              { id: 'data-science', label: 'Data Science' },
              { id: 'business', label: 'Business' }
            ].map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>

          {/* Course Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {getCourses().map((course) => (
              <div key={course.id} className="bg-gray-700 rounded-lg p-6 hover:bg-gray-600 transition-colors">
                <div className="mb-4">
                  <h4 className="text-lg font-semibold text-white mb-2">{course.title}</h4>
                  <p className="text-gray-300 text-sm mb-3">{course.description}</p>
                  
                  <div className="flex justify-between text-sm text-gray-400 mb-2">
                    <span>👨‍🏫 {course.instructor}</span>
                    <span>⏱️ {course.duration}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm text-gray-400 mb-4">
                    <span>📈 {course.difficulty}</span>
                    <span>⭐ {course.rating} ({course.enrolled} students)</span>
                  </div>
                </div>

                {/* Course Videos Preview */}
                <div className="mb-4">
                  <h5 className="text-sm font-semibold text-gray-300 mb-2">Course Content:</h5>
                  <div className="space-y-1">
                    {course.videos.slice(0, 2).map((video) => (
                      <div 
                        key={video.id}
                        className="flex justify-between items-center p-2 bg-gray-800 rounded text-xs cursor-pointer hover:bg-gray-600"
                        onClick={() => playVideo(video)}
                      >
                        <span className="text-gray-300">▶️ {video.title}</span>
                        <span className="text-gray-400">{video.duration}</span>
                      </div>
                    ))}
                    {course.videos.length > 2 && (
                      <div className="text-xs text-gray-400 text-center py-1">
                        +{course.videos.length - 2} more lessons
                      </div>
                    )}
                  </div>
                </div>

                <button 
                  onClick={() => enrollInCourse(course.id)}
                  className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition-colors"
                >
                  Enroll Now
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Video Player Modal */}
        {selectedVideo && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-white">{selectedVideo.title}</h3>
                <button 
                  onClick={() => setSelectedVideo(null)}
                  className="text-gray-400 hover:text-white text-2xl"
                >
                  ×
                </button>
              </div>
              
              <div className="bg-gray-900 rounded-lg p-8 text-center mb-4">
                <div className="text-6xl mb-4">🎬</div>
                <p className="text-gray-300 mb-2">Video: {selectedVideo.title}</p>
                <p className="text-gray-400">Duration: {selectedVideo.duration}</p>
                <button className="bg-indigo-600 text-white px-6 py-3 rounded-lg mt-4 hover:bg-indigo-700">
                  ▶️ Play Video
                </button>
              </div>
              
              <p className="text-gray-400 text-sm text-center">
                Video player integration coming soon
              </p>
            </div>
          </div>
        )}

        {/* Learning Path Suggestion */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-xl font-semibold text-white mb-4">🗺️ Suggested Learning Path</h3>
          <div className="flex items-center space-x-4 overflow-x-auto pb-4">
            {['Beginner', 'Intermediate', 'Advanced', 'Expert'].map((level, index) => (
              <div key={level} className="flex items-center space-x-2 min-w-max">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  index === 0 ? 'bg-green-600' : index === 1 ? 'bg-blue-600' : 'bg-gray-600'
                }`}>
                  {index + 1}
                </div>
                <div>
                  <div className="text-white font-medium">{level}</div>
                  <div className="text-gray-400 text-sm">
                    {index === 0 ? 'Current' : index === 1 ? 'Next' : 'Future'}
                  </div>
                </div>
                {index < 3 && (
                  <div className="w-8 h-0.5 bg-gray-600 mx-2"></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
