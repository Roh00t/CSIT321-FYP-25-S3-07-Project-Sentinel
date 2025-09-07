// src/pages/AppUserProfilePage.tsx

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserSession } from '../hooks/useUserSession';

interface AppProfile {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  subscription_plan: string;
  created_at: string | null;
}

export default function AppUserProfilePage() {
  const { token } = useUserSession();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<AppProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        const res = await fetch('http://127.0.0.1:5000/api/auth/appuser/profile', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!res.ok) throw new Error('Failed to load profile');

        const data = await res.json();
        setProfile(data);
      } catch (err: any) {
        console.error('Fetch error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [token, navigate]);

  if (loading) return <p className="text-center">Loading...</p>;
  if (error) return <p className="text-red-600 text-center">Error: {error}</p>;
  if (!profile) return <p className="text-center">No data.</p>;

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
        </div>

        <div className="mt-8 text-center">
          <button
            onClick={() => navigate('/app/profile/edit')}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow transition duration-200 transform hover:scale-[1.02]"
          >
            Edit Profile
          </button>
        </div>
      </div>

      <footer className="mt-16 text-center text-gray-500 text-sm">
        © {new Date().getFullYear()} SENTINEL | App User Profile
      </footer>
    </div>
  );
}