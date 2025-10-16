// frontend/src/pages/VerifyAdminEmailPage.tsx
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function VerifyAdminEmailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'idle' | 'verifying' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      setMessage('Invalid or missing verification token.');
      return;
    }

    const verifyToken = async () => {
      setStatus('verifying');
      try {
        const res = await fetch(`http://127.0.0.1:5000/api/auth/verify-admin-email?token=${encodeURIComponent(token)}`);
        const data = await res.json();

        if (res.ok) {
          setStatus('success');
          setMessage(data.msg || 'Admin email verified successfully!');
          // Redirect after 3 seconds
          setTimeout(() => {
            navigate('/app/profile');
          }, 3000);
        } else {
          setStatus('error');
          setMessage(data.msg || 'Verification failed. The token may be invalid or expired.');
        }
      } catch (err) {
        setStatus('error');
        setMessage('Network error. Please try again later.');
      }
    };

    verifyToken();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-xl shadow-md max-w-md w-full text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Admin Email Verification</h1>

        {status === 'verifying' && (
          <>
            <p className="text-gray-600 mb-4">Verifying your admin email...</p>
            <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
          </>
        )}

        {status === 'success' && (
          <div className="text-green-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-green-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <p className="text-lg font-medium">{message}</p>
            <p className="text-gray-500 mt-2">Redirecting to your profile...</p>
          </div>
        )}

        {status === 'error' && (
          <div className="text-red-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-red-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <p className="text-lg font-medium">{message}</p>
            <button
              onClick={() => navigate('/app/profile')}
              className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
            >
              Go to Profile
            </button>
          </div>
        )}
      </div>
    </div>
  );
}