// src/pages/VerifyEmailPage.tsx
import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState('');
  const hasVerified = useRef(false);

  useEffect(() => {
    if (hasVerified.current) return;
    
    const verify = async () => {
      // Small delay to ensure URL is stable
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const token = searchParams.get('token');
      if (!token) {
        setStatus('error');
        setMessage('No verification token found in the URL.');
        return;
      }

      setStatus('verifying');
      try {
        const url = `http://127.0.0.1:5000/api/auth/verify-email?token=${encodeURIComponent(token)}`;
        const res = await fetch(url, { method: 'GET' });
        const data = await res.json();

        if (res.ok) {
          setStatus('success');
          setMessage('Your email has been verified! Redirecting to login...');
          setTimeout(() => navigate('/login'), 2000);
        } else {
          setStatus('error');
          setMessage(data.msg || 'Verification failed.');
        }
      } catch (err) {
        setStatus('error');
        setMessage('Network error. Please try again.');
      }
    };

    hasVerified.current = true;
    verify();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center">
        {status === 'verifying' && (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>Verifying your email...</p>
          </>
        )}
        {status === 'success' && (
          <>
            <div className="text-5xl mb-4">✅</div>
            <p className="text-green-600 font-medium">{message}</p>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="text-5xl mb-4">❌</div>
            <p className="text-red-600 font-medium">{message}</p>
            <button
              onClick={() => navigate('/login')}
              className="mt-4 text-blue-600 hover:underline"
            >
              Go to Login
            </button>
          </>
        )}
      </div>
    </div>
  );
}