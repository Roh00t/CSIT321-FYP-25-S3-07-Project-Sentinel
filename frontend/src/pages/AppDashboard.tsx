// src/pages/AppDashboard.tsx
import { useUserSession } from '../hooks/useUserSession';
import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { refreshPlanFromBackend } from '../utils/refreshPlan';

export default function AppDashboard() {
  const { username, user_plan } = useUserSession(); // ← This is already reactive!
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);

  // Handle Stripe upgrade success
  useEffect(() => {
    const handleStripeSuccess = async () => {
      if (searchParams.get('upgrade') === 'success') {
        setShowSuccessBanner(true);
        navigate('/app/dashboard', { replace: true });
        await refreshPlanFromBackend(); // This updates localStorage → triggers reactivity
      }
    };

    handleStripeSuccess();
  }, [searchParams, navigate]);

  // Auto-hide banner
  useEffect(() => {
    if (showSuccessBanner) {
      const timer = setTimeout(() => setShowSuccessBanner(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [showSuccessBanner]);

  // Display logic: fallback to 'Basic' if null/undefined
  const displayPlan = user_plan || 'Basic';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-12 px-4">
      {/* Success Banner */}
      {showSuccessBanner && (
        <div className="max-w-4xl mx-auto mb-6 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg flex items-center justify-between">
          <span className="font-medium">Plan upgraded successfully!</span>
          <button 
            onClick={() => setShowSuccessBanner(false)}
            className="text-green-700 hover:text-green-900"
          >
            ×
          </button>
        </div>
      )}

      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-5xl font-extrabold text-blue-600">SENTINEL</h1>
        <p className="text-xl text-gray-700 mt-2">User Dashboard</p>
      </div>

      {/* Dashboard Card */}
      <div className="max-w-4xl mx-auto bg-white p-8 rounded-xl shadow-lg border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-gray-800">Hi {username}!</h2>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-green-800 mb-2">Welcome to Your Dashboard</h3>
          <p className="text-green-700">
            This is your personal dashboard. You can view your subscription, usage stats, and settings here.
          </p>
        </div>

        {/* Reactive Subscription Display */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-50 p-5 rounded-lg border text-center transition-all duration-300">
            <h4 className="font-bold text-gray-700">Subscription</h4>
            <p className="text-2xl font-bold mt-2">
              {displayPlan === 'Basic' && <span className="text-gray-600">{displayPlan}</span>}
              {displayPlan === 'Pro' && <span className="text-blue-600">{displayPlan}</span>}
              {displayPlan === 'Team' && <span className="text-green-600">{displayPlan}</span>}
            </p>
          </div>
          <div className="bg-gray-50 p-5 rounded-lg border text-center">
            <h4 className="font-bold text-gray-700">Usage</h4>
            <p className="text-2xl font-bold text-blue-600 mt-2">0%</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-16 text-center text-gray-500 text-sm">
        © {new Date().getFullYear()} SENTINEL | User Dashboard
      </footer>
    </div>
  );
}