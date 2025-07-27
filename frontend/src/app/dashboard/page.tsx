'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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

export default function Dashboard() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    const userData = localStorage.getItem('cognilearn_user');
    if (userData) {
      setCurrentUser(JSON.parse(userData));
    }
  }, []);

  // Get personalized recommendations based on user preferences
  const getPersonalizedRecommendations = () => {
    if (!currentUser?.preferences) return [];
    
    const { field, experience, learningStyle } = currentUser.preferences;
    
    const recommendations: Record<string, any[]> = {
      "Technology": [
        { icon: "💻", title: "Python Fundamentals", description: "Start with Python basics", section: "courses" },
        { icon: "🌐", title: "Web Development", description: "Build modern websites", section: "courses" },
        { icon: "📱", title: "Mobile Apps", description: "Create mobile applications", section: "courses" }
      ],
      "Business": [
        { icon: "📊", title: "Data Analysis", description: "Business intelligence basics", section: "courses" },
        { icon: "💼", title: "Management", description: "Leadership skills", section: "courses" },
        { icon: "📈", title: "Marketing", description: "Digital marketing strategies", section: "courses" }
      ],
      "Science": [
        { icon: "🔬", title: "Research Methods", description: "Scientific methodology", section: "courses" },
        { icon: "📚", title: "Literature Review", description: "Academic research", section: "courses" },
        { icon: "📋", title: "Data Collection", description: "Research techniques", section: "courses" }
      ]
    };
    
    return recommendations[field] || recommendations["Technology"];
  };

  const navigateToSection = (section: string) => {
    router.push(`/${section}`);
  };

  return (
    <AuthenticatedLayout>
      <div className="space-y-8">
        {/* Personalized Welcome */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-white mb-4">
            Welcome back, test123! 👋
          </h2>
          {currentUser?.preferences && (
            <div className="bg-gray-800 rounded-lg p-6 mb-8 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4">Your Learning Profile</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                <div className="text-center">
                  <p className="text-gray-400">Goal</p>
                  <p className="text-indigo-400 font-semibold">{currentUser.preferences.studyGoal}</p>
                </div>
                <div className="text-center">
                  <p className="text-gray-400">Field</p>
                  <p className="text-indigo-400 font-semibold">{currentUser.preferences.field}</p>
                </div>
                <div className="text-center">
                  <p className="text-gray-400">Experience</p>
                  <p className="text-indigo-400 font-semibold">{currentUser.preferences.experience}</p>
                </div>
                <div className="text-center">
                  <p className="text-gray-400">Time Commitment</p>
                  <p className="text-indigo-400 font-semibold">{currentUser.preferences.timeCommitment}</p>
                </div>
                <div className="text-center">
                  <p className="text-gray-400">Learning Style</p>
                  <p className="text-indigo-400 font-semibold">{currentUser.preferences.learningStyle}</p>
                </div>
              </div>
            </div>
          )}
          
          <p className="text-xl text-gray-300 mb-8">
            {currentUser?.preferences?.field 
              ? `Continue your journey in ${currentUser.preferences.field}`
              : 'AI-powered adaptive learning platform with personalized recommendations'
            }
          </p>
        </div>

        {/* Personalized Recommendations */}
        {currentUser?.preferences && (
          <div className="bg-gray-800 rounded-lg p-6 mb-8 border border-gray-700">
            <h3 className="text-xl font-semibold text-white mb-4">
              🎯 Recommended for {currentUser.preferences.field}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {getPersonalizedRecommendations().map((item: any, index: number) => (
                <div key={index} className="bg-gray-700 rounded-lg p-4 hover:bg-gray-600 transition-colors">
                  <div className="text-2xl mb-2">{item.icon}</div>
                  <h4 className="font-semibold text-white">{item.title}</h4>
                  <p className="text-gray-300 text-sm">{item.description}</p>
                  <button 
                    onClick={() => navigateToSection(item.section)}
                    className="mt-2 text-indigo-400 hover:text-indigo-300 text-sm"
                  >
                    Start Learning →
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Course Recommendations */}
          <div className="bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border border-gray-700">
            <div className="text-center">
              <div className="text-4xl mb-4">🎓</div>
              <h3 className="text-xl font-semibold mb-2 text-white">Course Recommendations</h3>
              <p className="text-gray-300 mb-4">
                AI-powered personalized course suggestions with embedded videos
              </p>
              <button 
                onClick={() => navigateToSection('courses')}
                className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition-colors">
                View Courses
              </button>
            </div>
          </div>

          {/* Resume Analyzer */}
          <div className="bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border border-gray-700">
            <div className="text-center">
              <div className="text-4xl mb-4">📄</div>
              <h3 className="text-xl font-semibold mb-2 text-white">Resume Analyzer</h3>
              <p className="text-gray-300 mb-4">
                AI-powered resume analysis and improvement suggestions
              </p>
              <button 
                onClick={() => navigateToSection('resume')}
                className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition-colors">
                Analyze Resume
              </button>
            </div>
          </div>

          {/* Learning Roadmap */}
          <div className="bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border border-gray-700">
            <div className="text-center">
              <div className="text-4xl mb-4">🗺️</div>
              <h3 className="text-xl font-semibold mb-2 text-white">Learning Roadmap</h3>
              <p className="text-gray-300 mb-4">
                Personalized learning paths and progress tracking
              </p>
              <button 
                onClick={() => navigateToSection('roadmap')}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors">
                View Roadmap
              </button>
            </div>
          </div>

          {/* Notes Section */}
          <div className="bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border border-gray-700">
            <div className="text-center">
              <div className="text-4xl mb-4">📝</div>
              <h3 className="text-xl font-semibold mb-2 text-white">Smart Notes</h3>
              <p className="text-gray-300 mb-4">
                Take notes with AI-powered organization and insights
              </p>
              <button 
                onClick={() => navigateToSection('notes')}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors">
                Open Notes
              </button>
            </div>
          </div>

          {/* Summary Generator */}
          <div className="bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border border-gray-700">
            <div className="text-center">
              <div className="text-4xl mb-4">📋</div>
              <h3 className="text-xl font-semibold mb-2 text-white">Content Summary</h3>
              <p className="text-gray-300 mb-4">
                Generate AI-powered summaries of any content
              </p>
              <button 
                onClick={() => navigateToSection('summary')}
                className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700 transition-colors">
                Create Summary
              </button>
            </div>
          </div>

          {/* Profile Section */}
          <div className="bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border border-gray-700">
            <div className="text-center">
              <div className="text-4xl mb-4">👤</div>
              <h3 className="text-xl font-semibold mb-2 text-white">Profile & Settings</h3>
              <p className="text-gray-300 mb-4">
                Manage your account and learning preferences
              </p>
              <button 
                onClick={() => navigateToSection('profile')}
                className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors">
                View Profile
              </button>
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
