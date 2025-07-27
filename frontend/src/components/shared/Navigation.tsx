'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

interface NavigationProps {
  onLogout: () => void;
}

export default function Navigation({ onLogout }: NavigationProps) {
  const pathname = usePathname();
  const router = useRouter();

  const navItems = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/courses', label: 'Courses' },
    { href: '/resume', label: 'Resume' },
    { href: '/roadmap', label: 'Roadmap' },
    { href: '/notes', label: 'Notes' },
    { href: '/summary', label: 'Summary' },
    { href: '/profile', label: 'Profile' },
  ];

  const handleLogout = () => {
    localStorage.removeItem('cognilearn_user');
    onLogout();
    router.push('/login');
  };

  return (
    <header className="bg-gray-900 shadow-sm border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/dashboard" className="flex items-center">
              <h1 className="text-2xl font-bold text-indigo-400">🧠 CogniLearn</h1>
              <span className="ml-2 text-sm text-gray-400">AI-Powered Learning</span>
            </Link>
          </div>
          <nav className="hidden md:flex space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`${
                  pathname === item.href 
                    ? 'text-indigo-400' 
                    : 'text-gray-300'
                } hover:text-indigo-400 transition-colors`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center space-x-4">
            <button 
              onClick={handleLogout} 
              className="text-red-500 font-bold hover:text-red-400 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
