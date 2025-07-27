'use client';

import { useState, useEffect } from 'react';

export default function Home() {
  const [aiStatus, setAiStatus] = useState('checking...');
  const [backendStatus, setBackendStatus] = useState('checking...');

  useEffect(() => {
    // Check AI services status
    fetch('http://localhost:8000/')
      .then(res => res.json())
      .then(data => setAiStatus('✅ Connected'))
      .catch(() => setAiStatus('❌ Disconnected'));

    // Check backend status
    fetch('http://localhost:3001/')
      .then(() => setBackendStatus('✅ Connected'))
      .catch(() => setBackendStatus('❌ Disconnected'));
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-indigo-600">🧠 CogniLearn</h1>
              <span className="ml-2 text-sm text-gray-500">AI-Powered Learning</span>
            </div>
            <nav className="hidden md:flex space-x-8">
              <a href="#dashboard" className="text-gray-700 hover:text-indigo-600">Dashboard</a>
              <a href="#courses" className="text-gray-700 hover:text-indigo-600">Courses</a>
              <a href="#quiz" className="text-gray-700 hover:text-indigo-600">Quiz</a>
              <a href="#analysis" className="text-gray-700 hover:text-indigo-600">Research</a>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to CogniLearn
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            AI-powered adaptive learning platform with personalized recommendations
          </p>
          
          {/* Service Status */}
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h3 className="text-lg font-semibold mb-4">System Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <span>AI Services:</span>
                <span className="font-mono text-sm">{aiStatus}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <span>Backend API:</span>
                <span className="font-mono text-sm">{backendStatus}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {/* Course Recommendations */}
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="text-center">
              <div className="text-4xl mb-4">🎓</div>
              <h3 className="text-xl font-semibold mb-2">Course Recommendations</h3>
              <p className="text-gray-600 mb-4">
                AI-powered personalized course suggestions based on your learning goals
              </p>
              <button className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">
                Get Recommendations
              </button>
            </div>
          </div>

          {/* Quiz Generator */}
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="text-center">
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="text-xl font-semibold mb-2">Adaptive Quizzes</h3>
              <p className="text-gray-600 mb-4">
                Dynamic quiz generation with difficulty adaptation using Gemini AI
              </p>
              <button className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                Generate Quiz
              </button>
            </div>
          </div>

          {/* Research Analyzer */}
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="text-center">
              <div className="text-4xl mb-4">🔬</div>
              <h3 className="text-xl font-semibold mb-2">Research Analysis</h3>
              <p className="text-gray-600 mb-4">
                Analyze research papers with Google Gemini and NVIDIA Llama 3
              </p>
              <button className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700">
                Analyze Paper
              </button>
            </div>
          </div>
        </div>

        {/* API Testing Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold mb-4">🛠️ API Testing</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2">AI Services Endpoints:</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="http://localhost:8000/docs" target="_blank" 
                     className="text-indigo-600 hover:underline">
                    📚 API Documentation (Swagger)
                  </a>
                </li>
                <li>
                  <a href="http://localhost:8000/" target="_blank"
                     className="text-indigo-600 hover:underline">
                    🔗 Service Status
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Available Features:</h4>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>✅ Google Gemini AI Integration</li>
                <li>✅ NVIDIA Llama 3 70B Model</li>
                <li>✅ Research Paper Analysis</li>
                <li>✅ Adaptive Quiz Generation</li>
                <li>✅ Course Recommendations</li>
                <li>✅ Performance Analytics</li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-gray-300">
              🚀 CogniLearn - AI-Powered Adaptive Learning Platform
            </p>
            <p className="text-sm text-gray-400 mt-2">
              Powered by Google Gemini AI & NVIDIA Llama 3
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
