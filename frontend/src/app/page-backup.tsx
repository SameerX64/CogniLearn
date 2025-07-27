'use client';

import { useState, useEffect } from 'react';

export default function Home() {
  // Authentication and User State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'signup'
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);
  
  // Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Onboarding Answers
  const [onboardingData, setOnboardingData] = useState({
    studyGoal: '',
    field: '',
    experience: '',
    timeCommitment: '',
    learningStyle: ''
  });

  // Existing States
  const [aiStatus, setAiStatus] = useState('checking...');
  const [backendStatus, setBackendStatus] = useState('checking...');
  const [activeSection, setActiveSection] = useState('dashboard');
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [notes, setNotes] = useState('');
  const [resumeText, setResumeText] = useState('');
  const [resumeAnalysis, setResumeAnalysis] = useState(null);

  useEffect(() => {
    // Check if user is already logged in
    const savedUser = localStorage.getItem('cognilearn_user');
    if (savedUser) {
      const user = JSON.parse(savedUser);
      setCurrentUser(user);
      setIsAuthenticated(true);
      
      // Check if user needs onboarding
      if (!user.onboardingCompleted) {
        setShowOnboarding(true);
      }
    }

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

  // Authentication Functions
  const handleLogin = (e) => {
    e.preventDefault();
    // Simulate login (in real app, call your backend)
    const user = {
      id: Date.now(),
      name: name || email.split('@')[0],
      email: email,
      onboardingCompleted: false
    };
    
    setCurrentUser(user);
    setIsAuthenticated(true);
    setShowOnboarding(true);
    localStorage.setItem('cognilearn_user', JSON.stringify(user));
  };

  const handleSignup = (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert('Passwords do not match!');
      return;
    }
    
    const user = {
      id: Date.now(),
      name: name,
      email: email,
      onboardingCompleted: false
    };
    
    setCurrentUser(user);
    setIsAuthenticated(true);
    setShowOnboarding(true);
    localStorage.setItem('cognilearn_user', JSON.stringify(user));
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    setActiveSection('dashboard');
    localStorage.removeItem('cognilearn_user');
  };

  // Onboarding Functions
  const onboardingQuestions = [
    {
      question: "What is your primary learning goal?",
      field: "studyGoal",
      options: [
        "Career advancement",
        "Skill development",
        "Academic learning",
        "Personal interest",
        "Job preparation"
      ]
    },
    {
      question: "Which field interests you most?",
      field: "field",
      options: [
        "Technology & Programming",
        "Data Science & AI",
        "Business & Management",
        "Design & Creative",
        "Science & Research",
        "Other"
      ]
    },
    {
      question: "What's your experience level?",
      field: "experience",
      options: [
        "Complete beginner",
        "Some experience",
        "Intermediate",
        "Advanced",
        "Expert level"
      ]
    },
    {
      question: "How much time can you dedicate to learning per week?",
      field: "timeCommitment",
      options: [
        "1-3 hours",
        "4-7 hours",
        "8-15 hours",
        "16-25 hours",
        "25+ hours"
      ]
    },
    {
      question: "What's your preferred learning style?",
      field: "learningStyle",
      options: [
        "Video tutorials",
        "Interactive exercises",
        "Reading materials",
        "Hands-on projects",
        "Mixed approach"
      ]
    }
  ];

  const handleOnboardingAnswer = (answer) => {
    const currentQuestion = onboardingQuestions[onboardingStep];
    setOnboardingData(prev => ({
      ...prev,
      [currentQuestion.field]: answer
    }));

    if (onboardingStep < onboardingQuestions.length - 1) {
      setOnboardingStep(onboardingStep + 1);
    } else {
      // Complete onboarding
      const updatedUser = {
        ...currentUser,
        onboardingCompleted: true,
        preferences: onboardingData
      };
      setCurrentUser(updatedUser);
      setShowOnboarding(false);
      localStorage.setItem('cognilearn_user', JSON.stringify(updatedUser));
    }
  };

  // Render Authentication Screen
  const renderAuth = () => (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-indigo-400 mb-2">🧠 CogniLearn</h1>
          <p className="text-gray-300">AI-Powered Adaptive Learning Platform</p>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-8 border border-gray-700">
          <div className="flex mb-6">
            <button
              onClick={() => setAuthMode('login')}
              className={`flex-1 py-2 px-4 rounded-l-lg ${
                authMode === 'login' 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-gray-700 text-gray-300'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setAuthMode('signup')}
              className={`flex-1 py-2 px-4 rounded-r-lg ${
                authMode === 'signup' 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-gray-700 text-gray-300'
              }`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={authMode === 'login' ? handleLogin : handleSignup} className="space-y-4">
            {authMode === 'signup' && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                  required
                />
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                required
              />
            </div>
            
            {authMode === 'signup' && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                  required
                />
              </div>
            )}
            
            <button
              type="submit"
              className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700"
            >
              {authMode === 'login' ? 'Login' : 'Create Account'}
            </button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-gray-400 text-sm">
              {authMode === 'login' ? "Don't have an account? " : "Already have an account? "}
              <button
                onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
                className="text-indigo-400 hover:text-indigo-300"
              >
                {authMode === 'login' ? 'Sign up' : 'Login'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  // Render Onboarding Screen
  const renderOnboarding = () => {
    const currentQuestion = onboardingQuestions[onboardingStep];
    const progress = ((onboardingStep + 1) / onboardingQuestions.length) * 100;

    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
        <div className="max-w-2xl w-full space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-white mb-2">Welcome to CogniLearn!</h1>
            <p className="text-gray-300 mb-6">Let's personalize your learning experience</p>
            
            {/* Progress Bar */}
            <div className="w-full bg-gray-700 rounded-full h-2 mb-8">
              <div 
                className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            
            <p className="text-sm text-gray-400 mb-8">
              Question {onboardingStep + 1} of {onboardingQuestions.length}
            </p>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-8 border border-gray-700">
            <h2 className="text-2xl font-semibold text-white mb-6 text-center">
              {currentQuestion.question}
            </h2>
            
            <div className="space-y-3">
              {currentQuestion.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleOnboardingAnswer(option)}
                  className="w-full text-left p-4 bg-gray-700 hover:bg-gray-600 rounded-lg border border-gray-600 hover:border-indigo-500 transition-all text-white"
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Sample YouTube videos for courses
  const courseVideos = [
    { id: 'dQw4w9WgXcQ', title: 'Machine Learning Fundamentals', duration: '15:30' },
    { id: 'jNQXAC9IVRw', title: 'Deep Learning Basics', duration: '22:45' },
    { id: 'YQHsXMglC9A', title: 'Data Science Introduction', duration: '18:20' },
    { id: 'fNxaJsNG3-s', title: 'Python for Beginners', duration: '45:10' }
  ];

  const analyzeResume = async () => {
    if (!resumeText.trim()) return;
    
    try {
      const response = await fetch('http://localhost:8000/api/research/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: resumeText,
          title: 'Resume Analysis',
          language: 'english'
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        setResumeAnalysis(result);
      }
    } catch (error) {
      console.error('Resume analysis failed:', error);
    }
  };

  const renderDashboard = () => (
    <div className="space-y-8">
      {/* Personalized Welcome */}
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold text-white mb-4">
          Welcome back, {currentUser?.name}! 👋
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
        
        {/* Service Status */}
        <div className="bg-gray-800 rounded-lg shadow p-6 mb-8 border border-gray-700">
          <h3 className="text-lg font-semibold mb-4 text-white">System Status</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3 bg-gray-700 rounded">
              <span className="text-gray-300">AI Services:</span>
              <span className="font-mono text-sm text-green-400">{aiStatus}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-700 rounded">
              <span className="text-gray-300">Backend API:</span>
              <span className="font-mono text-sm text-green-400">{backendStatus}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Personalized Recommendations */}
      {currentUser?.preferences && (
        <div className="bg-gray-800 rounded-lg p-6 mb-8 border border-gray-700">
          <h3 className="text-xl font-semibold text-white mb-4">
            🎯 Recommended for {currentUser.preferences.field}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {getPersonalizedRecommendations().map((item, index) => (
              <div key={index} className="bg-gray-700 rounded-lg p-4 hover:bg-gray-600 transition-colors">
                <div className="text-2xl mb-2">{item.icon}</div>
                <h4 className="font-semibold text-white">{item.title}</h4>
                <p className="text-gray-300 text-sm">{item.description}</p>
                <button 
                  onClick={() => setActiveSection(item.section)}
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
              onClick={() => setActiveSection('courses')}
              className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">
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
              onClick={() => setActiveSection('resume')}
              className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700">
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
              onClick={() => setActiveSection('roadmap')}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
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
              onClick={() => setActiveSection('notes')}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
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
              onClick={() => setActiveSection('summary')}
              className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700">
              Create Summary
            </button>
          </div>
        </div>

        {/* Quiz Generator */}
        <div className="bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border border-gray-700">
          <div className="text-center">
            <div className="text-4xl mb-4">🎯</div>
            <h3 className="text-xl font-semibold mb-2 text-white">Adaptive Quizzes</h3>
            <p className="text-gray-300 mb-4">
              Dynamic quiz generation with difficulty adaptation
            </p>
            <button 
              onClick={() => setActiveSection('quiz')}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">
              Generate Quiz
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Get personalized recommendations based on user preferences
  const getPersonalizedRecommendations = () => {
    if (!currentUser?.preferences) return [];
    
    const { field, experience, learningStyle } = currentUser.preferences;
    
    const recommendations = {
      "Technology & Programming": [
        { icon: "💻", title: "Python Fundamentals", description: "Start with Python basics", section: "courses" },
        { icon: "🌐", title: "Web Development", description: "Build modern websites", section: "courses" },
        { icon: "📱", title: "Mobile Apps", description: "Create mobile applications", section: "courses" }
      ],
      "Data Science & AI": [
        { icon: "📊", title: "Data Analysis", description: "Learn data manipulation", section: "courses" },
        { icon: "🤖", title: "Machine Learning", description: "AI and ML fundamentals", section: "courses" },
        { icon: "📈", title: "Statistics", description: "Statistical foundations", section: "courses" }
      ],
      "Business & Management": [
        { icon: "💼", title: "Leadership Skills", description: "Develop leadership abilities", section: "courses" },
        { icon: "📋", title: "Project Management", description: "Master project planning", section: "courses" },
        { icon: "💰", title: "Financial Planning", description: "Business finance basics", section: "courses" }
      ],
      "Design & Creative": [
        { icon: "🎨", title: "UI/UX Design", description: "User interface design", section: "courses" },
        { icon: "📸", title: "Photography", description: "Creative photography", section: "courses" },
        { icon: "✏️", title: "Graphic Design", description: "Visual design principles", section: "courses" }
      ]
    };
    
    return recommendations[field] || [
      { icon: "📚", title: "General Learning", description: "Explore various topics", section: "courses" },
      { icon: "🎯", title: "Skill Assessment", description: "Test your knowledge", section: "quiz" },
      { icon: "📝", title: "Study Notes", description: "Organize your learning", section: "notes" }
    ];
  };

  const renderCourses = () => {
    // Get personalized courses based on user preferences
    const getPersonalizedCourses = () => {
      if (!currentUser?.preferences) return courseVideos;
      
      const { field } = currentUser.preferences;
      
      const fieldVideos = {
        "Technology & Programming": [
          { id: 'dQw4w9WgXcQ', title: 'Python Programming Fundamentals', duration: '25:30' },
          { id: 'jNQXAC9IVRw', title: 'JavaScript for Beginners', duration: '32:45' },
          { id: 'YQHsXMglC9A', title: 'React Development Tutorial', duration: '45:20' },
          { id: 'fNxaJsNG3-s', title: 'Full Stack Development', duration: '55:10' }
        ],
        "Data Science & AI": [
          { id: 'dQw4w9WgXcQ', title: 'Machine Learning Fundamentals', duration: '35:30' },
          { id: 'jNQXAC9IVRw', title: 'Deep Learning with Python', duration: '42:45' },
          { id: 'YQHsXMglC9A', title: 'Data Analysis with Pandas', duration: '28:20' },
          { id: 'fNxaJsNG3-s', title: 'AI Ethics and Applications', duration: '25:10' }
        ],
        "Business & Management": [
          { id: 'dQw4w9WgXcQ', title: 'Leadership and Management', duration: '30:15' },
          { id: 'jNQXAC9IVRw', title: 'Project Management Basics', duration: '35:20' },
          { id: 'YQHsXMglC9A', title: 'Business Strategy', duration: '40:30' },
          { id: 'fNxaJsNG3-s', title: 'Financial Planning', duration: '28:45' }
        ]
      };
      
      return fieldVideos[field] || courseVideos;
    };

    const personalizedCourses = getPersonalizedCourses();

    return (
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">
              {currentUser?.preferences?.field ? 
                `${currentUser.preferences.field} Courses` : 
                'Course Recommendations'
              }
            </h2>
            {currentUser?.preferences && (
              <p className="text-gray-400">
                Curated for your {currentUser.preferences.experience} level
              </p>
            )}
          </div>
        </div>
        
        {selectedVideo ? (
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-white">{selectedVideo.title}</h3>
              <button 
                onClick={() => setSelectedVideo(null)}
                className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700">
                ← Back to Courses
              </button>
            </div>
            <div className="aspect-video bg-black rounded-lg overflow-hidden">
              <iframe
                width="100%"
                height="100%"
                src={`https://www.youtube.com/embed/${selectedVideo.id}?autoplay=1`}
                title={selectedVideo.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {personalizedCourses.map((video, index) => (
              <div key={index} className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:shadow-lg transition-shadow">
                <div 
                  className="aspect-video bg-gray-700 rounded-lg mb-4 cursor-pointer relative overflow-hidden"
                  onClick={() => setSelectedVideo(video)}
                >
                  <img 
                    src={`https://img.youtube.com/vi/${video.id}/maxresdefault.jpg`}
                    alt={video.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 hover:bg-opacity-20 transition-all">
                    <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center">
                      <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    </div>
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{video.title}</h3>
                <p className="text-gray-400 text-sm">Duration: {video.duration}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderResume = () => (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold text-white mb-6">Resume Analyzer</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-xl font-semibold text-white mb-4">Upload Resume Content</h3>
          <textarea
            value={resumeText}
            onChange={(e) => setResumeText(e.target.value)}
            placeholder="Paste your resume content here..."
            className="w-full h-64 bg-gray-700 text-white border border-gray-600 rounded-lg p-4 resize-none"
          />
          <button 
            onClick={analyzeResume}
            className="mt-4 bg-purple-600 text-white px-6 py-2 rounded hover:bg-purple-700">
            Analyze Resume
          </button>
        </div>
        
        {resumeAnalysis && (
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-xl font-semibold text-white mb-4">Analysis Results</h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-green-400">Strengths:</h4>
                <p className="text-gray-300 text-sm">Professional experience and technical skills well highlighted.</p>
              </div>
              <div>
                <h4 className="font-semibold text-orange-400">Improvements:</h4>
                <p className="text-gray-300 text-sm">Consider adding more quantifiable achievements and metrics.</p>
              </div>
              <div>
                <h4 className="font-semibold text-blue-400">Recommendations:</h4>
                <p className="text-gray-300 text-sm">Tailor keywords for ATS optimization and industry relevance.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderRoadmap = () => (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold text-white mb-6">Learning Roadmap</h2>
      
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="space-y-6">
          {/* Roadmap Steps */}
          {[
            { title: 'Fundamentals', status: 'completed', progress: 100 },
            { title: 'Intermediate Concepts', status: 'current', progress: 65 },
            { title: 'Advanced Topics', status: 'upcoming', progress: 0 },
            { title: 'Expert Level', status: 'locked', progress: 0 }
          ].map((step, index) => (
            <div key={index} className="flex items-center space-x-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                step.status === 'completed' ? 'bg-green-600' :
                step.status === 'current' ? 'bg-blue-600' :
                step.status === 'upcoming' ? 'bg-gray-600' : 'bg-gray-800'
              }`}>
                {step.status === 'completed' ? '✓' : index + 1}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white">{step.title}</h3>
                <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                  <div 
                    className={`h-2 rounded-full ${
                      step.status === 'completed' ? 'bg-green-600' :
                      step.status === 'current' ? 'bg-blue-600' : 'bg-gray-600'
                    }`}
                    style={{ width: `${step.progress}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-400 mt-1">{step.progress}% Complete</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderNotes = () => (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold text-white mb-6">Smart Notes</h2>
      
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-white">My Notes</h3>
          <button className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
            + New Note
          </button>
        </div>
        
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Start taking notes... AI will help organize and provide insights."
          className="w-full h-96 bg-gray-700 text-white border border-gray-600 rounded-lg p-4 resize-none"
        />
        
        <div className="flex space-x-4 mt-4">
          <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            Save Note
          </button>
          <button className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700">
            AI Insights
          </button>
          <button className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700">
            Generate Summary
          </button>
        </div>
      </div>
    </div>
  );

  const renderSummary = () => (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold text-white mb-6">Content Summary</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-xl font-semibold text-white mb-4">Input Content</h3>
          <textarea
            placeholder="Paste any content here to generate an AI-powered summary..."
            className="w-full h-64 bg-gray-700 text-white border border-gray-600 rounded-lg p-4 resize-none"
          />
          <button className="mt-4 bg-orange-600 text-white px-6 py-2 rounded hover:bg-orange-700">
            Generate Summary
          </button>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-xl font-semibold text-white mb-4">AI Summary</h3>
          <div className="bg-gray-700 rounded-lg p-4 h-64 overflow-y-auto">
            <p className="text-gray-300 text-sm">
              Your AI-generated summary will appear here. The summary will include:
              <br />• Key points and main ideas
              <br />• Important takeaways
              <br />• Actionable insights
              <br />• Structured overview
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderQuiz = () => (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold text-white mb-6">Adaptive Quiz</h2>
      
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-xl font-semibold text-white mb-4">Quiz Configuration</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Topic</label>
            <select className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg p-2">
              <option>Machine Learning</option>
              <option>Data Science</option>
              <option>Programming</option>
              <option>Mathematics</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Difficulty</label>
            <select className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg p-2">
              <option>Easy</option>
              <option>Medium</option>
              <option>Hard</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Questions</label>
            <select className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg p-2">
              <option>5 Questions</option>
              <option>10 Questions</option>
              <option>15 Questions</option>
            </select>
          </div>
        </div>
        
        <button className="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700">
          Generate Quiz
        </button>
      </div>
    </div>
  );

  const renderContent = () => {
    switch(activeSection) {
      case 'courses': return renderCourses();
      case 'resume': return renderResume();
      case 'roadmap': return renderRoadmap();
      case 'notes': return renderNotes();
      case 'summary': return renderSummary();
      case 'quiz': return renderQuiz();
      default: return renderDashboard();
    }
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 shadow-sm border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-indigo-400">🧠 CogniLearn</h1>
              <span className="ml-2 text-sm text-gray-400">AI-Powered Learning</span>
            </div>
            <nav className="hidden md:flex space-x-8">
              <button onClick={() => setActiveSection('dashboard')} 
                className={`${activeSection === 'dashboard' ? 'text-indigo-400' : 'text-gray-300'} hover:text-indigo-400`}>Dashboard</button>
              <button onClick={() => setActiveSection('courses')} 
                className={`${activeSection === 'courses' ? 'text-indigo-400' : 'text-gray-300'} hover:text-indigo-400`}>Courses</button>
              <button onClick={() => setActiveSection('resume')} 
                className={`${activeSection === 'resume' ? 'text-indigo-400' : 'text-gray-300'} hover:text-indigo-400`}>Resume</button>
              <button onClick={() => setActiveSection('roadmap')} 
                className={`${activeSection === 'roadmap' ? 'text-indigo-400' : 'text-gray-300'} hover:text-indigo-400`}>Roadmap</button>
              <button onClick={() => setActiveSection('notes')} 
                className={`${activeSection === 'notes' ? 'text-indigo-400' : 'text-gray-300'} hover:text-indigo-400`}>Notes</button>
              <button onClick={() => setActiveSection('summary')} 
                className={`${activeSection === 'summary' ? 'text-indigo-400' : 'text-gray-300'} hover:text-indigo-400`}>Summary</button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderContent()}
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white mt-16 border-t border-gray-700">
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
