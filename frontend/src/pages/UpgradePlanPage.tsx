// frontend/src/pages/UpgradePlanPage.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserSession } from '../hooks/useUserSession';

export default function UpgradePlanPage() {
  const { user_plan } = useUserSession();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Prevent non-basic users from accessing
  if (user_plan !== 'Basic') {
    navigate('/app/dashboard');
    return null;
  }

    const handleUpgrade = async (plan: 'Pro' | 'Team') => {
    setLoading(true);
    try {
        const response = await fetch('http://127.0.0.1:5000/api/auth/checkout/create-session', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ plan }),
        });

        const data = await response.json();
        
        if (!response.ok) {
        throw new Error(data.msg || 'Unknown error');
        }

        if (data.url) {
        window.location.href = data.url;
        }
    } catch (err: any) {
        alert(`Error: ${err.message}`);
        setLoading(false);
    }
    };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-md">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Upgrade Your Plan</h1>
        <p className="text-gray-600 mb-8">
          Unlock advanced features with Sentinel Pro or Team plans.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Pro Plan */}
          <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition">
            <h2 className="text-xl font-semibold text-blue-600">Pro Plan</h2>
            <p className="text-3xl font-bold my-2">$19.00<span className="text-lg font-normal text-gray-500">/month</span></p>
            <ul className="mt-4 space-y-2 text-gray-600">
              <li>✅ Real-time advanced alerts</li>
              <li>✅ 24/7 monitoring</li>
              <li>✅ Priority support</li>
            </ul>
            <button
              onClick={() => handleUpgrade('Pro')}
              disabled={loading}
              className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg disabled:opacity-50"
            >
              {loading ? 'Redirecting...' : 'Upgrade to Pro'}
            </button>
          </div>

          {/* Team Plan */}
          <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition">
            <h2 className="text-xl font-semibold text-green-600">Team Plan</h2>
            <p className="text-3xl font-bold my-2">$85.00<span className="text-lg font-normal text-gray-500">/month</span></p>
            <ul className="mt-4 space-y-2 text-gray-600">
              <li>✅ Everything in Pro</li>
              <li>✅ Up to 5 team members</li>
            </ul>
            <button
              onClick={() => handleUpgrade('Team')}
              disabled={loading}
              className="mt-6 w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg disabled:opacity-50"
            >
              {loading ? 'Redirecting...' : 'Upgrade to Team'}
            </button>
          </div>
        </div>

        <button
          onClick={() => navigate('/app/dashboard')}
          className="mt-6 text-gray-600 hover:text-gray-800"
        >
          ← Back to Dashboard
        </button>
      </div>
    </div>
  );
}