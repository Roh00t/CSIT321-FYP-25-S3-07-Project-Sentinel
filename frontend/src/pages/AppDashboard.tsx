// src/pages/AppDashboard.tsx

import { useUserSession } from '../hooks/useUserSession';
import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { refreshPlanFromBackend } from '../utils/refreshPlan';
import apiClient from '../components/apiClient';

interface ProfileData {
  username: string;
  subscription_plan: string;
  pending_team_invitation: {
    team_id: number;
    team_name: string;
    invited_at: string;
  } | null;
}

export default function AppDashboard() {
  const { token } = useUserSession();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch full profile data including team invitations
  const fetchProfile = async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const res = await apiClient.get('/api/auth/appuser/profile');
      setProfile(res.data);
    } catch (err: any) {
      console.error('Failed to fetch profile:', err);
      // 401 is handled globally — no need to act here
    } finally {
      setLoading(false);
    }
  };

  // Handle Stripe upgrade success
  useEffect(() => {
    const handleStripeSuccess = async () => {
      if (searchParams.get('upgrade') === 'success') {
        setShowSuccessBanner(true);
        navigate('/app/dashboard', { replace: true });
        await refreshPlanFromBackend();
        fetchProfile(); // Refresh profile after plan update
      }
    };

    handleStripeSuccess();
  }, [searchParams, navigate]);

  // Initial profile fetch and periodic refresh
  useEffect(() => {
    fetchProfile();
    
    // Refresh profile every 30 seconds to catch team invitations
    const interval = setInterval(fetchProfile, 30000);
    return () => clearInterval(interval);
  }, [token]);

  // Auto-hide banner
  useEffect(() => {
    if (showSuccessBanner) {
      const timer = setTimeout(() => setShowSuccessBanner(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [showSuccessBanner]);

  const handleAcceptInvitation = async () => {
    if (!token) return;
    
    try {
      const response = await apiClient.post('/api/auth/teams/accept-invitation');

      // Refresh profile and localStorage
      await fetchProfile();
      await refreshPlanFromBackend();
      alert("Invitation accepted!");
    } catch (err: any) {
      if (err.response?.status === 401) return;
      const msg = err.response?.data?.msg || 'Failed to accept invitation. Please try again.';
      alert(msg);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <p className="text-xl text-gray-600">Loading dashboard...</p>
      </div>
    );
  }

  const displayPlan = profile?.subscription_plan || 'Basic';

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

      {/* Team Invitation Banner */}
      {profile?.pending_team_invitation && (
        <div className="max-w-4xl mx-auto mb-6 bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-3 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <p className="font-medium">
              You've been invited to join team "{profile.pending_team_invitation.team_name}"!
            </p>
            <p className="text-sm mt-1">
              Accept to upgrade to Team plan and access team features.
            </p>
          </div>
          <button 
            onClick={handleAcceptInvitation}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg whitespace-nowrap transition-colors"
          >
            Accept Invitation
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
          <h2 className="text-3xl font-bold text-gray-800">Hi {profile?.username}!</h2>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-green-800 mb-2">Welcome to Your Dashboard</h3>
          <p className="text-green-700">
            This is your personal dashboard. You can view your subscription plan and acccept team invitations here. Enjoy your SENTINEL experience!
          </p>
          <p className="text-green-700 mt-2">
            Proceed to{' '}
            <a
              href={displayPlan === 'Basic' ? '/app/alerts/basic' : '/app/alerts'}
              className="text-blue-600 hover:underline"
            >
              App
            </a>{' '}
            to start using SENTINEL's features.
          </p>
        </div>

        <div className="mt-8">
          <div className="bg-gray-50 p-5 rounded-lg border text-center transition-all duration-300">
            <h4 className="font-bold text-gray-700">Current Plan</h4>
            <p className="text-2xl font-bold mt-2">
              {displayPlan === 'Basic' && <span className="text-gray-600">{displayPlan}</span>}
              {displayPlan === 'Pro' && <span className="text-blue-600">{displayPlan}</span>}
              {displayPlan === 'Team' && <span className="text-green-600">{displayPlan}</span>}
            </p>
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