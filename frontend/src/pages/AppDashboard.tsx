// src/pages/AppDashboard.tsx
import { useUserSession } from '../hooks/useUserSession';
import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { refreshPlanFromBackend } from '../utils/refreshPlan';

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
  const { token } = useUserSession(); // Get token for API calls
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
      const res = await fetch('http://127.0.0.1:5000/api/auth/appuser/profile', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setProfile(data);
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
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
        // Refresh profile after plan update
        fetchProfile();
      }
    };

    handleStripeSuccess();
  }, [searchParams, navigate]);

  // Initial profile fetch and periodic refresh
  useEffect(() => {
    fetchProfile();
    
    // Optional: Refresh profile every 30 seconds to catch team invitations
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
      const response = await fetch('http://127.0.0.1:5000/api/auth/teams/accept-invitation', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (response.ok) {
        // Refresh profile to show updated plan and remove invitation
        await fetchProfile();
        await refreshPlanFromBackend(); // Update localStorage for useUserSession
      } else {
        const errorData = await response.json();
        alert(errorData.msg || 'Failed to accept invitation');
      }
    } catch (error) {
      console.error('Failed to accept invitation:', error);
      alert('Failed to accept invitation. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <p className="text-xl text-gray-600">Loading dashboard...</p>
      </div>
    );
  }

  // Display logic: fallback to 'Basic' if null/undefined
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