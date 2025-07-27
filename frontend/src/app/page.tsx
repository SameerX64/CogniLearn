'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Check if user is authenticated
    const userData = localStorage.getItem('cognilearn_user');
    
    if (userData) {
      const user = JSON.parse(userData);
      
      // If user exists but hasn't completed onboarding
      if (!user.onboardingCompleted) {
        router.push('/onboarding');
      } else {
        // User is authenticated and onboarded, go to dashboard
        router.push('/dashboard');
      }
    } else {
      // No user data, redirect to login
      router.push('/login');
    }
  }, [router]);

  // Loading state while redirecting
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-indigo-400 mb-4">🧠 CogniLearn</h1>
        <p className="text-gray-300 mb-4">AI-Powered Learning Platform</p>
        <div className="text-indigo-400">Loading...</div>
      </div>
    </div>
  );
}
