// src/pages/AppUserProfilePage.tsx

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserSession } from '../hooks/useUserSession';
import apiClient from '../components/apiClient';

interface AppProfile {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  subscription_plan: string;
  created_at: string | null;
  subscription_end_date: string | null;
  admin_email: string;
}

export default function AppUserProfilePage() {
  const { token } = useUserSession();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<AppProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showAdminEmailModal, setShowAdminEmailModal] = useState(false);
  const [adminEmailInput, setAdminEmailInput] = useState('');
  const [adminEmailSubmitting, setAdminEmailSubmitting] = useState(false);
  const [adminEmailMessage, setAdminEmailMessage] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        const res = await apiClient.get('/api/auth/appuser/profile');
        setProfile(res.data);
      } catch (err: any) {
        console.error('Fetch error:', err);
        if (err.response?.status !== 401) {
          setError(err.message || 'Failed to load profile');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [token, navigate]);

  if (loading) return <p className="text-center">Loading...</p>;
  if (error) return <p className="text-red-600 text-center">Error: {error}</p>;
  if (!profile) return <p className="text-center">No data.</p>;

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to delete your account? This action cannot be undone."
    );
    if (!confirmed) return;

    try {
      const res = await apiClient.delete('/api/auth/appuser/delete', {
        data: { confirm: true },
      });

      alert(res.data.msg || "Account deleted successfully.");

      localStorage.removeItem('token');
      localStorage.removeItem('user_type');
      localStorage.removeItem('username');
      localStorage.removeItem('email');
      window.dispatchEvent(new Event('sessionchange'));

      navigate('/');
    } catch (err: any) {
      if (err.response?.status !== 401) {
        alert(err.response?.data?.msg || "Failed to delete account.");
      }
    }
  };

  const handleRequestAdminEmail = async () => {
    if (!adminEmailInput.trim()) return;

    setAdminEmailSubmitting(true);
    setAdminEmailMessage('');

    try {
      const res = await apiClient.post('/api/auth/admin-email/request', {
        email: adminEmailInput.trim(),
      });

      setAdminEmailMessage('Verification email sent! Please check your inbox.');
      setAdminEmailInput('');
      setTimeout(() => setShowAdminEmailModal(false), 2000);
    } catch (err: any) {
      if (err.response?.status === 401) {
        // Handled globally — do nothing here
        return;
      }
      setAdminEmailMessage(err.response?.data?.msg || 'Failed to send verification email.');
    } finally {
      setAdminEmailSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-12 px-4">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-5xl font-extrabold text-blue-600">SENTINEL</h1>
        <p className="text-xl text-gray-700 mt-2">Your Profile</p>
      </div>

      {/* Profile Card */}
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-lg border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-gray-800">Profile</h2>
        </div>

        <div className="space-y-6">
          <div className="bg-blue-50 p-5 rounded-lg border">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">Full Name</h3>
            <p className="text-xl text-blue-900">{profile.first_name} {profile.last_name}</p>
          </div>

          <div className="bg-gray-50 p-5 rounded-lg border">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Username</h3>
            <p className="text-xl font-mono text-gray-700">{profile.username}</p>
          </div>

          <div className="bg-gray-50 p-5 rounded-lg border">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Email</h3>
            <p className="text-xl text-gray-700">{profile.email}</p>
          </div>

          <div className="bg-gray-50 p-5 rounded-lg border">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Admin Email</h3>
            <p className="text-xl text-gray-700">{profile.admin_email}</p>
          </div>

          <div className="bg-green-50 p-5 rounded-lg border">
            <h3 className="text-lg font-semibold text-green-800 mb-2">Subscription Plan</h3>
            <p className="text-xl font-bold text-green-900">{profile.subscription_plan}</p>
          </div>

          <div className="bg-gray-50 p-5 rounded-lg border">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Joined</h3>
            <p className="text-xl text-gray-700">
              {profile.created_at
                ? new Date(profile.created_at).toLocaleDateString()
                : 'Unknown'}
            </p>
          </div>

          <div className="bg-gray-50 p-5 rounded-lg border">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Subscription End Date</h3>
            <p className="text-xl text-gray-700">
              {profile.subscription_end_date
                ? new Date(profile.subscription_end_date).toLocaleDateString()
                : '—'}
            </p>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200 space-y-4">
          <button
            onClick={() => navigate('/app/plan')}
            className="w-full px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow transition duration-200 transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
          >
            Manage Plan
          </button>
          <button
            onClick={() => navigate('/app/profile/edit')}
            className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow transition duration-200 transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Edit Profile
          </button>

          <button
            onClick={() => setShowAdminEmailModal(true)}
            className="w-full px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg shadow transition duration-200 transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
          >
            Set Admin Email
          </button>

          <button
            onClick={handleDeleteAccount}
            className="w-full px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg shadow transition duration-200 transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            Delete My Account
          </button>
        </div>
      </div>

      {/* Admin Email Modal */}
      {showAdminEmailModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Set Admin Email</h3>
            <p className="text-gray-600 mb-4">
              This email will be used for administrative communications. You’ll need to verify it.
            </p>
            <input
              type="email"
              value={adminEmailInput}
              onChange={(e) => setAdminEmailInput(e.target.value)}
              placeholder="admin@example.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            {adminEmailMessage && (
              <p className={`mt-2 text-sm ${adminEmailMessage.includes('successfully') ? 'text-green-600' : 'text-red-600'}`}>
                {adminEmailMessage}
              </p>
            )}
            <div className="mt-4 flex gap-3">
              <button
                onClick={() => setShowAdminEmailModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleRequestAdminEmail}
                disabled={adminEmailSubmitting}
                className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg disabled:opacity-60"
              >
                {adminEmailSubmitting ? 'Sending...' : 'Send Verification'}
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="mt-16 text-center text-gray-500 text-sm">
        © {new Date().getFullYear()} SENTINEL | App User Profile
      </footer>
    </div>
  );
}