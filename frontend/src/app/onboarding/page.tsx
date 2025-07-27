'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

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

export default function Onboarding() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [onboardingData, setOnboardingData] = useState({
    studyGoal: '',
    field: '',
    experience: '',
    timeCommitment: '',
    learningStyle: ''
  });
  const router = useRouter();

  useEffect(() => {
    const userData = localStorage.getItem('cognilearn_user');
    if (!userData) {
      router.push('/login');
      return;
    }
    
    const user = JSON.parse(userData);
    setCurrentUser(user);
    
    // If already completed onboarding, redirect to dashboard
    if (user.onboardingCompleted) {
      router.push('/dashboard');
    }
  }, [router]);

  const onboardingQuestions = [
    {
      question: "What is your primary learning goal?",
      field: "studyGoal",
      options: [
        "Career advancement",
        "Personal enrichment", 
        "Academic improvement",
        "Skill development",
        "Professional certification"
      ]
    },
    {
      question: "What field are you most interested in?",
      field: "field",
      options: [
        "Technology", 
        "Business", 
        "Science", 
        "Arts & Design",
        "Healthcare"
      ]
    },
    {
      question: "What's your current experience level?",
      field: "experience",
      options: [
        "Beginner", 
        "Intermediate", 
        "Advanced", 
        "Expert",
        "Mixed (varies by topic)"
      ]
    },
    {
      question: "How much time can you dedicate to learning daily?",
      field: "timeCommitment",
      options: [
        "15-30 minutes", 
        "30-60 minutes", 
        "1-2 hours", 
        "2-3 hours",
        "3+ hours"
      ]
    },
    {
      question: "What's your preferred learning style?",
      field: "learningStyle",
      options: [
        "Visual (videos, diagrams)", 
        "Text-based (articles, books)", 
        "Interactive (quizzes, exercises)", 
        "Audio (podcasts, lectures)",
        "Mixed approach"
      ]
    }
  ];

  const handleOptionSelect = (value: string) => {
    const currentQuestion = onboardingQuestions[onboardingStep];
    setOnboardingData(prev => ({
      ...prev,
      [currentQuestion.field]: value
    }));
  };

  const handleNext = () => {
    if (onboardingStep < onboardingQuestions.length - 1) {
      setOnboardingStep(onboardingStep + 1);
    } else {
      completeOnboarding();
    }
  };

  const handlePrevious = () => {
    if (onboardingStep > 0) {
      setOnboardingStep(onboardingStep - 1);
    }
  };

  const completeOnboarding = () => {
    if (currentUser) {
      const updatedUser = {
        ...currentUser,
        onboardingCompleted: true,
        preferences: onboardingData
      };
      
      localStorage.setItem('cognilearn_user', JSON.stringify(updatedUser));
      router.push('/dashboard');
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-indigo-400 text-lg">Loading...</div>
      </div>
    );
  }

  const currentQuestion = onboardingQuestions[onboardingStep];
  const currentAnswer = onboardingData[currentQuestion.field as keyof typeof onboardingData];

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="max-w-2xl w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-indigo-400 mb-2">🧠 Welcome to CogniLearn</h1>
          <p className="text-gray-300">Let's personalize your learning experience</p>
        </div>

        <div className="bg-gray-800 rounded-lg p-8 border border-gray-700">
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between text-sm text-gray-400 mb-2">
              <span>Step {onboardingStep + 1} of {onboardingQuestions.length}</span>
              <span>{Math.round(((onboardingStep + 1) / onboardingQuestions.length) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((onboardingStep + 1) / onboardingQuestions.length) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Question */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-6">
              {currentQuestion.question}
            </h2>
            
            <div className="space-y-3">
              {currentQuestion.options.map((option) => (
                <button
                  key={option}
                  onClick={() => handleOptionSelect(option)}
                  className={`w-full p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                    currentAnswer === option
                      ? 'border-indigo-500 bg-indigo-500/20 text-indigo-300'
                      : 'border-gray-600 bg-gray-700 text-gray-300 hover:border-gray-500 hover:bg-gray-600'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-between">
            <button
              onClick={handlePrevious}
              disabled={onboardingStep === 0}
              className="px-6 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            
            <button
              onClick={handleNext}
              disabled={!currentAnswer}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {onboardingStep === onboardingQuestions.length - 1 ? 'Complete' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
