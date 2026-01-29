import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

export default function AuthSuccess() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { login } = useAuth();
    const { addToast } = useToast();

    useEffect(() => {
        const token = searchParams.get('token');
        if (token) {
            // We set a temporary loading user, the AuthProvider will fetch the real one via getMe
            login(token, { id: 'temp', name: 'User', email: 'user@example.com' });
            addToast("Google Login Successful!", "success");
            navigate('/');
        } else {
            navigate('/login');
        }
    }, [searchParams]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
            <div className="text-center">
                <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="font-bold text-gray-900 dark:text-white">Completing Login...</p>
            </div>
        </div>
    );
}
