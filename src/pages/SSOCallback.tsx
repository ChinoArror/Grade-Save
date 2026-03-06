import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function SSOCallback() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const navigate = useNavigate();
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!token) {
            setError('Token missing');
            return;
        }

        const verifyToken = async () => {
            try {
                const res = await fetch('/api/sso-callback', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token }),
                });

                const data = await res.json() as any;

                if (data.success) {
                    localStorage.setItem('auth', 'true');
                    localStorage.setItem('sso_token', token);
                    localStorage.setItem('user_uuid', data.user.uuid);
                    localStorage.setItem('user_name', data.user.name || data.user.username);

                    window.location.href = '/';
                } else {
                    setError(data.message || 'Verification failed');
                }
            } catch (err: any) {
                setError(err.message || 'Network error');
            }
        };

        verifyToken();
    }, [token, navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4 transition-colors duration-300">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="text-center space-y-4"
            >
                <div className="text-2xl font-bold">Authenticating...</div>
                {error ? (
                    <div className="text-red-500">{error}. <a href="/login" className="underline hover:text-red-600">Try again</a></div>
                ) : (
                    <div className="text-zinc-500">Please wait while we verify your session.</div>
                )}
            </motion.div>
        </div>
    );
}
