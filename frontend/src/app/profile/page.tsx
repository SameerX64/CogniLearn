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

export default function Profile() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    const userData = localStorage.getItem('cognilearn_user');
    if (userData) {
      const user = JSON.parse(userData);
      setCurrentUser(user);
      setEditedUser(user);
    }
  }, []);

  const saveProfile = () => {
    if (editedUser) {
      localStorage.setItem('cognilearn_user', JSON.stringify(editedUser));
      setCurrentUser(editedUser);
      setIsEditing(false);
      alert('Profile updated successfully!');
    }
  };

  const retakeOnboarding = () => {
    router.push('/onboarding');
  };

  const getAchievements = () => [
    { id: 1, title: 'First Login', description: 'Completed your first login', earned: true, date: '2024-01-15' },
    { id: 2, title: 'Profile Complete', description: 'Filled out complete profile', earned: true, date: '2024-01-15' },
    { id: 3, title: 'First Course', description: 'Enrolled in your first course', earned: false, date: null },
    { id: 4, title: 'Knowledge Seeker', description: 'Completed 5 courses', earned: false, date: null },
    { id: 5, title: 'Note Taker', description: 'Created 10 study notes', earned: false, date: null },
    { id: 6, title: 'Streak Master', description: '7-day learning streak', earned: false, date: null }
  ];

  const getStats = () => ({
    coursesCompleted: 2,
    totalStudyTime: '45 hours',
    notesCreated: 8,
    quizzesTaken: 12,
    currentStreak: 3,
    totalPoints: 1250
  });

  if (!currentUser) {
    return (
      <AuthenticatedLayout>
        <div className="text-center py-8">
          <p className="text-gray-300">Loading profile...</p>
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="space-y-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">👤 Profile & Settings</h1>
          <p className="text-xl text-gray-300">
            Manage your account and learning preferences
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold text-white">Profile Information</h2>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
                >
                  {isEditing ? 'Cancel' : 'Edit Profile'}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Name</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedUser?.name || ''}
                      onChange={(e) => setEditedUser(prev => prev ? {...prev, name: e.target.value} : null)}
                      className="w-full bg-gray-700 text-white border border-gray-600 rounded px-3 py-2"
                    />
                  ) : (
                    <p className="text-white bg-gray-700 px-3 py-2 rounded">{currentUser.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                  {isEditing ? (
                    <input
                      type="email"
                      value={editedUser?.email || ''}
                      onChange={(e) => setEditedUser(prev => prev ? {...prev, email: e.target.value} : null)}
                      className="w-full bg-gray-700 text-white border border-gray-600 rounded px-3 py-2"
                    />
                  ) : (
                    <p className="text-white bg-gray-700 px-3 py-2 rounded">{currentUser.email}</p>
                  )}
                </div>
              </div>

              {isEditing && (
                <div className="mt-6">
                  <button
                    onClick={saveProfile}
                    className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 mr-3"
                  >
                    Save Changes
                  </button>
                </div>
              )}
            </div>

            {/* Learning Preferences */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold text-white">Learning Preferences</h2>
                <button
                  onClick={retakeOnboarding}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Update Preferences
                </button>
              </div>

              {currentUser.preferences ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Learning Goal</label>
                    <p className="text-white bg-gray-700 px-3 py-2 rounded">{currentUser.preferences.studyGoal}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Field of Interest</label>
                    <p className="text-white bg-gray-700 px-3 py-2 rounded">{currentUser.preferences.field}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Experience Level</label>
                    <p className="text-white bg-gray-700 px-3 py-2 rounded">{currentUser.preferences.experience}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Time Commitment</label>
                    <p className="text-white bg-gray-700 px-3 py-2 rounded">{currentUser.preferences.timeCommitment}</p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-300 mb-2">Learning Style</label>
                    <p className="text-white bg-gray-700 px-3 py-2 rounded">{currentUser.preferences.learningStyle}</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-400 mb-4">No learning preferences set</p>
                  <button
                    onClick={retakeOnboarding}
                    className="bg-indigo-600 text-white px-6 py-2 rounded hover:bg-indigo-700"
                  >
                    Complete Setup
                  </button>
                </div>
              )}
            </div>

            {/* Achievements */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h2 className="text-2xl font-semibold text-white mb-6">🏆 Achievements</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {getAchievements().map((achievement) => (
                  <div 
                    key={achievement.id}
                    className={`p-4 rounded-lg border ${
                      achievement.earned 
                        ? 'bg-green-900 border-green-600' 
                        : 'bg-gray-700 border-gray-600'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className={`font-semibold ${
                        achievement.earned ? 'text-green-400' : 'text-gray-400'
                      }`}>
                        {achievement.title}
                      </h3>
                      <span className="text-2xl">
                        {achievement.earned ? '✅' : '🔒'}
                      </span>
                    </div>
                    <p className={`text-sm ${
                      achievement.earned ? 'text-green-300' : 'text-gray-500'
                    }`}>
                      {achievement.description}
                    </p>
                    {achievement.earned && achievement.date && (
                      <p className="text-xs text-green-400 mt-1">
                        Earned: {achievement.date}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Stats Sidebar */}
          <div className="space-y-6">
            {/* Learning Stats */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h3 className="text-xl font-semibold text-white mb-4">📊 Learning Stats</h3>
              <div className="space-y-4">
                {Object.entries(getStats()).map(([key, value]) => (
                  <div key={key} className="flex justify-between items-center">
                    <span className="text-gray-300 capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}:
                    </span>
                    <span className="text-white font-semibold">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h3 className="text-xl font-semibold text-white mb-4">⚡ Quick Actions</h3>
              <div className="space-y-3">
                <button className="w-full bg-indigo-600 text-white p-3 rounded hover:bg-indigo-700 text-left">
                  📚 View Learning History
                </button>
                <button className="w-full bg-green-600 text-white p-3 rounded hover:bg-green-700 text-left">
                  📋 Export Progress Report
                </button>
                <button className="w-full bg-blue-600 text-white p-3 rounded hover:bg-blue-700 text-left">
                  🎯 Set Learning Goals
                </button>
                <button className="w-full bg-purple-600 text-white p-3 rounded hover:bg-purple-700 text-left">
                  🔔 Notification Settings
                </button>
              </div>
            </div>

            {/* Account Settings */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h3 className="text-xl font-semibold text-white mb-4">⚙️ Account Settings</h3>
              <div className="space-y-3">
                <button className="w-full bg-yellow-600 text-white p-3 rounded hover:bg-yellow-700 text-left">
                  🔒 Change Password
                </button>
                <button className="w-full bg-gray-600 text-white p-3 rounded hover:bg-gray-700 text-left">
                  📱 Privacy Settings
                </button>
                <button className="w-full bg-red-600 text-white p-3 rounded hover:bg-red-700 text-left">
                  🗑️ Delete Account
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
