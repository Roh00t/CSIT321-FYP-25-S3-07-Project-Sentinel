// src/pages/AdminDashboard.tsx
import { useState, useEffect } from 'react';
import { useUserSession } from '../hooks/useUserSession';
import apiClient from '../components/apiClient';

export default function AdminDashboard() {
  const { username } = useUserSession();
  const [userCount, setUserCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserCount = async () => {
      try {
        const response = await apiClient.get('/api/auth/admin/users');
        setUserCount(response.data.users?.length || 0);
      } catch (err: any) {
        console.error('Error fetching user count:', err);
        setError(err.message || 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchUserCount();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-12 px-4">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-5xl font-extrabold text-blue-600">SENTINEL</h1>
        <p className="text-xl text-gray-700 mt-2">Admin Dashboard</p>
      </div>

      {/* Dashboard Card */}
      <div className="max-w-4xl mx-auto bg-white p-8 rounded-xl shadow-lg border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-gray-800">Hi Admin, {username}!</h2>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-blue-800 mb-2">Welcome to the Admin Panel</h3>
          <p className="text-blue-700">
            This is your secure admin dashboard. You can view and manage users here.
          </p>
        </div>

        {/* Dynamic Users Card Only */}
        <div className="mt-8">
          <div className="bg-gray-50 p-6 rounded-lg border text-center">
            <h4 className="font-bold text-gray-700">Total Users</h4>
            <p className="text-3xl font-bold text-blue-600 mt-2">
              {loading ? (
                <span className="animate-pulse">Loading...</span>
              ) : error ? (
                <span className="text-red-500">Error</span>
              ) : (
                userCount
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-16 text-center text-gray-500 text-sm">
        © {new Date().getFullYear()} SENTINEL | Admin Dashboard
      </footer>
    </div>
  );
}