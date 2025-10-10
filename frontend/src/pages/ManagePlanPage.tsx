// frontend/src/pages/ManagePlanPage.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserSession } from '../hooks/useUserSession';

interface AppProfile {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  subscription_plan: string; // "Basic", "Pro", "Team"
  created_at: string | null;
  subscription_end_date: string | null;
  is_cancelling: boolean; // ← NEW FIELD
}

export default function ManagePlanPage() {
  const { token } = useUserSession();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<AppProfile | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        const res = await fetch('http://127.0.0.1:5000/api/auth/appuser/profile', {
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (!res.ok) throw new Error('Failed to load profile');

        const data = await res.json();
        setProfile(data);
      } catch (err: any) {
        console.error('Profile fetch error:', err);
        alert('Failed to load plan info.');
        navigate('/app/dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [token, navigate]);

  const handleUpgrade = async (plan: 'Pro' | 'Team') => {
    if (!token) return;
    setActionLoading(true);
    try {
      const response = await fetch('http://127.0.0.1:5000/api/auth/checkout/create-session', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
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
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelPlan = async () => {
    if (!token || !profile) return;
    
    const confirmed = window.confirm(
      profile.subscription_plan === 'Pro'
        ? "Are you sure you want to cancel your Pro plan? You'll keep access until " + 
          (profile.subscription_end_date 
            ? new Date(profile.subscription_end_date).toLocaleDateString()
            : 'the end of your billing period') + 
          ". No further charges will be made."
        : "Are you sure you want to cancel your Team plan? You'll keep access until " + 
          (profile.subscription_end_date 
            ? new Date(profile.subscription_end_date).toLocaleDateString()
            : 'the end of your billing period') + 
          ". No further charges will be made."
    );
    
    if (!confirmed) return;

    setActionLoading(true);
    try {
      const response = await fetch('http://127.0.0.1:5000/api/auth/subscription/cancel', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        alert(data.msg);
        // Refresh profile to reflect cancellation status
        const res = await fetch('http://127.0.0.1:5000/api/auth/appuser/profile', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        const updatedProfile = await res.json();
        setProfile(updatedProfile);
      } else {
        alert(data.msg || 'Failed to cancel plan.');
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-xl text-gray-600">Loading plan details...</p>
      </div>
    );
  }

  if (!profile) return null;

  const isBasic = profile.subscription_plan === 'Basic';
  const isPro = profile.subscription_plan === 'Pro';
  const isTeam = profile.subscription_plan === 'Team';
  const isCancelling = profile.is_cancelling;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-xl shadow-md">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Manage Your Plan</h1>
        <p className="text-gray-600 mb-6">
          View your current subscription and make changes as needed.
        </p>

        {/* Current Plan Summary */}
        <div className="mb-8 p-5 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-blue-800">Current Plan</h3>
              <p className="text-2xl font-bold text-blue-900 mt-1">{profile.subscription_plan}</p>
              <p className="text-blue-700 mt-2">
                Subscription end date:{" "}
                {profile.subscription_end_date 
                  ? new Date(profile.subscription_end_date).toLocaleDateString()
                  : isBasic 
                    ? "— (Basic plan)" 
                    : "Loading..."}
              </p>
              {isCancelling && profile.subscription_end_date && (
                <p className="text-orange-600 mt-1 text-sm font-medium">
                  ⏳ Cancelling at end of period ({new Date(profile.subscription_end_date).toLocaleDateString()})
                </p>
              )}
            </div>
            {!isBasic && !isCancelling && (
              <button
                onClick={handleCancelPlan}
                disabled={actionLoading}
                className="mt-4 md:mt-0 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg disabled:opacity-60"
              >
                {actionLoading ? 'Processing...' : 'Cancel Plan'}
              </button>
            )}
            {isCancelling && (
              <span className="mt-4 md:mt-0 px-4 py-2 bg-orange-100 text-orange-800 font-medium rounded-lg">
                Cancelling
              </span>
            )}
          </div>
        </div>

        {/* Plan Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Pro Plan */}
          <div className={`border rounded-lg p-6 transition ${isPro ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:shadow-md'}`}>
            <div className="flex justify-between items-start">
              <h2 className="text-xl font-semibold text-blue-600">Pro Plan</h2>
              {isPro && (
                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                  {isCancelling ? 'Cancelling' : 'Current'}
                </span>
              )}
            </div>
            <p className="text-3xl font-bold my-2">$19.00<span className="text-lg font-normal text-gray-500">/month</span></p>
            <ul className="mt-4 space-y-2 text-gray-600">
              <li>✅ Real-time advanced alerts</li>
              <li>✅ 24/7 monitoring</li>
              <li>✅ Priority support</li>
            </ul>
            {!isPro && (
              <button
                onClick={() => handleUpgrade('Pro')}
                disabled={actionLoading}
                className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg disabled:opacity-50"
              >
                {actionLoading ? 'Processing...' : isBasic ? 'Upgrade to Pro' : 'Switch to Pro'}
              </button>
            )}
          </div>

          {/* Team Plan */}
          <div className={`border rounded-lg p-6 transition ${isTeam ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:shadow-md'}`}>
            <div className="flex justify-between items-start">
              <h2 className="text-xl font-semibold text-green-600">Team Plan</h2>
              {isTeam && (
                <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                  {isCancelling ? 'Cancelling' : 'Current'}
                </span>
              )}
            </div>
            <p className="text-3xl font-bold my-2">$85.00<span className="text-lg font-normal text-gray-500">/month</span></p>
            <ul className="mt-4 space-y-2 text-gray-600">
              <li>✅ Everything in Pro</li>
              <li>✅ Up to 5 team members</li>
            </ul>
            {!isTeam && (
              <button
                onClick={() => handleUpgrade('Team')}
                disabled={actionLoading}
                className="mt-6 w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg disabled:opacity-50"
              >
                {actionLoading ? 'Processing...' : isBasic ? 'Upgrade to Team' : 'Switch to Team'}
              </button>
            )}
          </div>
        </div>

        <button
          onClick={() => navigate('/app/profile')}
          className="mt-8 text-gray-600 hover:text-gray-800 flex items-center"
        >
          ← Back to Profile
        </button>
      </div>
    </div>
  );
}