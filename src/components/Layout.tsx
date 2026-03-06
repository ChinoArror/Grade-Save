import { Outlet, useNavigate } from 'react-router-dom';
import { Button } from '@/src/components/ui/button';
import { LogOut, Moon, Sun, BookOpen } from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function Layout() {
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return false;
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const handleLogout = async () => {
    // 1. Clear local session from storage
    localStorage.removeItem('auth');
    localStorage.removeItem('sso_token');
    localStorage.removeItem('user_uuid');
    localStorage.removeItem('user_name');

    // 2. Clear SSO center cookie via redirect
    const SSO_URL = 'https://accounts.aryuki.com';
    const afterLogoutUrl = encodeURIComponent(window.location.origin + '/login');
    window.location.href = `${SSO_URL}/logout?redirect=${afterLogoutUrl}`;
  };

  const userName = localStorage.getItem('user_name');

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 flex flex-col transition-colors duration-300">
      <header className="sticky top-0 z-50 w-full border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur transition-colors duration-300">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-2 font-semibold">
            <BookOpen className="h-5 w-5" />
            <span>Exam Tracker</span>
          </div>
          <div className="flex items-center gap-4">
            {userName && <span className="text-sm font-medium text-zinc-500 hidden sm:inline-block">Welcome, {userName}</span>}
            <div className="flex gap-2">
              <Button variant="ghost" size="icon" onClick={() => setIsDark(!isDark)} className="hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors">
                {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>
              <Button variant="ghost" size="icon" onClick={handleLogout} className="hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-950 dark:hover:text-red-400 transition-colors">
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>
      <motion.main
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3 }}
        className="flex-1 container mx-auto p-4 md:p-8"
      >
        <Outlet />
      </motion.main>
    </div>
  );
}
