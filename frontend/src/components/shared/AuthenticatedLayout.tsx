'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from './Navigation';

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

interface AuthenticatedLayoutProps {
  children: React.ReactNode;
}

export default function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const userData = localStorage.getItem('cognilearn_user');
    if (userData) {
      const user = JSON.parse(userData);
      setCurrentUser(user);
      
      // Redirect to onboarding if not completed
      if (!user.onboardingCompleted) {
        router.push('/onboarding');
        return;
      }
    } else {
      router.push('/login');
      return;
    }
    setIsLoading(false);
  }, [router]);

  const handleLogout = () => {
    setCurrentUser(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-indigo-400 text-lg">Loading...</div>
      </div>
    );
  }

  if (!currentUser) {
    return null; // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-black">
      <Navigation onLogout={handleLogout} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      <footer className="bg-gray-900 text-white mt-16 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-gray-300">
              🚀 CogniLearn - AI-Powered Adaptive Learning Platform
            </p>
            <p className="text-sm text-gray-400 mt-2">
              Made for Fun
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
