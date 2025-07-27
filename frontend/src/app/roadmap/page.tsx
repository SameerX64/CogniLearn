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

export default function Roadmap() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const userData = localStorage.getItem('cognilearn_user');
    if (userData) {
      setCurrentUser(JSON.parse(userData));
    }
  }, []);

  const getRoadmapSteps = () => {
    if (!currentUser?.preferences) {
      return [
        { title: 'Complete Profile Setup', status: 'current', progress: 50 },
        { title: 'Choose Learning Path', status: 'upcoming', progress: 0 },
        { title: 'Begin Fundamentals', status: 'locked', progress: 0 },
        { title: 'Advanced Learning', status: 'locked', progress: 0 }
      ];
    }

    const { field, experience } = currentUser.preferences;
    
    if (field === 'Technology') {
      return [
        { title: 'Programming Fundamentals', status: 'completed', progress: 100 },
        { title: 'Web Development Basics', status: 'current', progress: 65 },
        { title: 'Advanced Frameworks', status: 'upcoming', progress: 15 },
        { title: 'System Design & Architecture', status: 'locked', progress: 0 }
      ];
    } else if (field === 'Business') {
      return [
        { title: 'Business Fundamentals', status: 'completed', progress: 100 },
        { title: 'Data Analysis & Insights', status: 'current', progress: 45 },
        { title: 'Strategic Planning', status: 'upcoming', progress: 0 },
        { title: 'Leadership & Management', status: 'locked', progress: 0 }
      ];
    } else {
      return [
        { title: 'Core Concepts', status: 'completed', progress: 100 },
        { title: 'Intermediate Topics', status: 'current', progress: 65 },
        { title: 'Advanced Studies', status: 'upcoming', progress: 0 },
        { title: 'Expert Level', status: 'locked', progress: 0 }
      ];
    }
  };

  return (
    <AuthenticatedLayout>
      <div className="space-y-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">🗺️ Learning Roadmap</h1>
          <p className="text-xl text-gray-300">
            Your personalized learning journey based on your goals and progress
          </p>
        </div>

        {/* Learning Progress Overview */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 mb-8">
          <h2 className="text-2xl font-semibold text-white mb-4">Your Progress</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-400">2</div>
              <p className="text-gray-300">Completed Modules</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-400">1</div>
              <p className="text-gray-300">In Progress</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-400">2</div>
              <p className="text-gray-300">Upcoming</p>
            </div>
          </div>
        </div>

        {/* Roadmap Steps */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-xl font-semibold text-white mb-6">Learning Path</h3>
          <div className="space-y-6">
            {getRoadmapSteps().map((step, index) => (
              <div key={index} className="flex items-center space-x-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold ${
                  step.status === 'completed' ? 'bg-green-600' :
                  step.status === 'current' ? 'bg-blue-600' :
                  step.status === 'upcoming' ? 'bg-gray-600' : 'bg-gray-800 border-2 border-gray-600'
                }`}>
                  {step.status === 'completed' ? '✓' : index + 1}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-lg font-semibold text-white">{step.title}</h4>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      step.status === 'completed' ? 'bg-green-600 text-white' :
                      step.status === 'current' ? 'bg-blue-600 text-white' :
                      step.status === 'upcoming' ? 'bg-yellow-600 text-white' : 'bg-gray-600 text-gray-300'
                    }`}>
                      {step.status === 'completed' ? 'Completed' :
                       step.status === 'current' ? 'In Progress' :
                       step.status === 'upcoming' ? 'Next Up' : 'Locked'}
                    </span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-3 mb-2">
                    <div 
                      className={`h-3 rounded-full transition-all duration-300 ${
                        step.status === 'completed' ? 'bg-green-600' :
                        step.status === 'current' ? 'bg-blue-600' : 'bg-gray-600'
                      }`}
                      style={{ width: `${step.progress}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between">
                    <p className="text-sm text-gray-400">{step.progress}% Complete</p>
                    {(step.status === 'current' || step.status === 'upcoming') && (
                      <button className="text-sm text-indigo-400 hover:text-indigo-300">
                        {step.status === 'current' ? 'Continue' : 'Start'} →
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recommended Next Steps */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-xl font-semibold text-white mb-4">Recommended Next Steps</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-700 rounded-lg p-4 hover:bg-gray-600 transition-colors">
              <h4 className="font-semibold text-white mb-2">📚 Study Session</h4>
              <p className="text-gray-300 text-sm mb-3">Continue with your current module</p>
              <button className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700">
                Start Learning
              </button>
            </div>
            <div className="bg-gray-700 rounded-lg p-4 hover:bg-gray-600 transition-colors">
              <h4 className="font-semibold text-white mb-2">🎯 Practice Quiz</h4>
              <p className="text-gray-300 text-sm mb-3">Test your knowledge so far</p>
              <button className="bg-purple-600 text-white px-4 py-2 rounded text-sm hover:bg-purple-700">
                Take Quiz
              </button>
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
