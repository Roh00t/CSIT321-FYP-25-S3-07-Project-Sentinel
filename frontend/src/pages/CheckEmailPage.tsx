// src/pages/CheckEmailPage.tsx
import { useLocation } from 'react-router-dom';

export default function CheckEmailPage() {
  const location = useLocation();
  const email = location.state?.email || 'your email';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center">
        <div className="text-5xl mb-4">📬</div>
        <h1 className="text-2xl font-bold text-gray-800 mb-3">Check Your Email</h1>
        <p className="text-gray-600 mb-6">
          We’ve sent a verification link to <strong>{email}</strong>.<br />
          Please click the link to activate your account.
        </p>
        <p className="text-sm text-gray-500">
          Didn’t receive it? Check your spam folder.
        </p>
      </div>
    </div>
  );
}