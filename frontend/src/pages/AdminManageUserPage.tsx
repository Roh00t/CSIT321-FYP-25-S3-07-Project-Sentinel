// src/pages/AdminManageUserPage.tsx

import { useState, useEffect } from 'react';
import { useUserSession } from '../hooks/useUserSession';
import { useNavigate } from 'react-router-dom';

interface AppUser {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  subscription_plan: string;
}

interface EditFormData {
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  subscription_plan: string;
  password: string;
  confirmPassword: string;
}

export default function AdminManageUserPage() {
  const { token } = useUserSession();
  const navigate = useNavigate();

  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit Modal
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [formData, setFormData] = useState<EditFormData>({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    subscription_plan: 'Basic',
    password: '',
    confirmPassword: '',
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  // Load all users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch('http://127.0.0.1:5000/api/auth/admin/users', {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (!res.ok) throw new Error('Failed to load users');

        const data = await res.json();
        setUsers(data.users);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (token) fetchUsers();
  }, [token]);

  // Open Edit Modal
  const openEditModal = async (user: AppUser) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      subscription_plan: user.subscription_plan,
      password: '',
      confirmPassword: '',
    });
    setFormError(null);
  };

  // Close Modal
  const closeEditModal = () => {
    setEditingUser(null);
    setFormError(null);
  };

  // Handle Form Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validate required fields
    if (!formData.username.trim()) {
      setFormError("Username is required");
      return;
    }
    if (!formData.first_name.trim()) {
      setFormError("First name is required");
      return;
    }
    if (!formData.last_name.trim()) {
      setFormError("Last name is required");
      return;
    }

    // Password match
    if (formData.password && formData.password !== formData.confirmPassword) {
      setFormError("Passwords don't match");
      return;
    }
    if (formData.password && formData.password.trim().length < 6) {
      setFormError("Password must be at least 6 characters");
      return;
    }

    setFormLoading(true);

    // Build payload
    const payload: Partial<EditFormData> = {};
    if (formData.username.trim()) payload.username = formData.username.trim();
    if (formData.email.trim()) payload.email = formData.email.trim();
    if (formData.first_name.trim()) payload.first_name = formData.first_name.trim();
    if (formData.last_name.trim()) payload.last_name = formData.last_name.trim();
    if (formData.subscription_plan) payload.subscription_plan = formData.subscription_plan;
    if (formData.password.trim()) payload.password = formData.password.trim();

    try {
      const res = await fetch(`http://127.0.0.1:5000/api/auth/admin/users/${editingUser?.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        alert(data.msg || 'User updated successfully!');
        // Update local list
        setUsers(users.map(u => u.id === editingUser?.id ? { ...u, ...payload } : u));
        closeEditModal();
      } else {
        setFormError(data.msg || 'Update failed');
      }
    } catch (err) {
      setFormError('Network error. Please try again.');
    } finally {
      setFormLoading(false);
    }
  };

  if (loading) return <p className="text-center">Loading users...</p>;
  if (error) return <p className="text-red-600 text-center">Error: {error}</p>;

  const handleDeleteUser = async (userId: number, username: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete user "${username}"? This cannot be undone.`
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`http://127.0.0.1:5000/api/auth/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await res.json();

      if (res.ok) {
        alert(data.msg || "User deleted successfully.");
        // Remove from local list
        setUsers(users.filter(u => u.id !== userId));
      } else {
        alert(data.msg || "Failed to delete user.");
      }
    } catch (err) {
      alert("Network error. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-12 px-4">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-5xl font-extrabold text-blue-600">SENTINEL</h1>
        <p className="text-xl text-gray-700 mt-2">Manage Users</p>
      </div>

      {/* User Table */}
      <div className="max-w-6xl mx-auto bg-white p-8 rounded-xl shadow-lg border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">User List</h2>

        {users.length === 0 ? (
          <p className="text-gray-500">No users found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-200">
              <thead>
                <tr className="bg-gray-50">
                  <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Name</th>
                  <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Username</th>
                  <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Email</th>
                  <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Plan</th>
                  <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id} className="border-t hover:bg-gray-50">
                    <td className="py-3 px-4">{user.first_name} {user.last_name}</td>
                    <td className="py-3 px-4 font-mono text-blue-900">{user.username}</td>
                    <td className="py-3 px-4">{user.email}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        user.subscription_plan === 'Team' ? 'bg-purple-100 text-purple-800' :
                        user.subscription_plan === 'Plus' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {user.subscription_plan}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => openEditModal(user)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        Edit
                      </button>
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => openEditModal(user)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium mr-4"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id, user.username)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">Edit User: {editingUser.username}</h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                placeholder="First Name"
                value={formData.first_name}
                onChange={e => setFormData({ ...formData, first_name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                required
              />
              <input
                type="text"
                placeholder="Last Name"
                value={formData.last_name}
                onChange={e => setFormData({ ...formData, last_name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                required
              />
              <input
                type="text"
                placeholder="Username"
                value={formData.username}
                onChange={e => setFormData({ ...formData, username: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                required
              />
              <input
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                required
              />

              <select
                value={formData.subscription_plan}
                onChange={e => setFormData({ ...formData, subscription_plan: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option value="Basic">Basic</option>
                <option value="Plus">Plus</option>
                <option value="Team">Team</option>
              </select>

              <input
                type="password"
                placeholder="New Password (optional)"
                value={formData.password}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
              <input
                type="password"
                placeholder="Confirm Password"
                value={formData.confirmPassword}
                onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />

              {formError && (
                <p className="text-red-600 text-sm">{formError}</p>
              )}

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="flex-1 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-70"
                >
                  {formLoading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-16 text-center text-gray-500 text-sm">
        © {new Date().getFullYear()} SENTINEL | Admin User Management
      </footer>
    </div>
  );
}