import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { motion } from 'framer-motion';
import { LogIn } from 'lucide-react';

export default function Login() {
  const handleSSOLogin = () => {
    const SSO_URL = 'https://accounts.aryuki.com';
    const APP_ID = 'grade-save';
    const RETURN_URL = window.location.origin + '/sso-callback';
    window.location.href = `${SSO_URL}/?client_id=${APP_ID}&redirect=${encodeURIComponent(RETURN_URL)}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4 transition-colors duration-300">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md"
      >
        <Card className="w-full border-zinc-200 dark:border-zinc-800 shadow-xl bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md">
          <CardHeader className="space-y-2 pb-6">
            <CardTitle className="text-3xl text-center font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Exam Tracker</CardTitle>
            <CardDescription className="text-center text-zinc-500 dark:text-zinc-400">
              Sign in to manage and view your test scores securely
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center pb-8">
            <Button
              onClick={handleSSOLogin}
              size="lg"
              className="w-full h-12 text-md transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-900 shadow-lg hover:shadow-xl"
            >
              <LogIn className="w-5 h-5 mr-2" />
              Sign in with Aryuki Auth
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
