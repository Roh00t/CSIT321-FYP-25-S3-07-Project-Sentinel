// src/pages/RegisterPage.tsx
import { useState } from 'react';
import type { FormEvent } from 'react';

interface RegisterResponse {
  msg?: string;
}

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
  });
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMessage(null);

    try {
      const res = await fetch('http://127.0.0.1:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data: RegisterResponse = await res.json();

      if (res.ok) {
        setMessage(data.msg || 'Registered successfully!');
        setError(false);
      } else {
        setMessage(data.msg || 'Registration failed');
        setError(true);
      }
    } catch (err) {
      setMessage('Network error');
      setError(true);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 border rounded shadow mt-6">
      <h2 className="text-2xl font-bold mb-4">Register</h2>
      <form onSubmit={handleSubmit}>
        {/* Username */}
        <input
          type="text"
          placeholder="Username"
          value={formData.username}
          onChange={(e) =>
            setFormData({ ...formData, username: e.target.value })
          }
          className="border p-2 mb-2 w-full"
          required
        />

        {/* Email */}
        <input
          type="email"
          placeholder="Email"
          value={formData.email}
          onChange={(e) =>
            setFormData({ ...formData, email: e.target.value })
          }
          className="border p-2 mb-2 w-full"
          required
        />

        {/* Password */}
        <input
          type="password"
          placeholder="Password"
          value={formData.password}
          onChange={(e) =>
            setFormData({ ...formData, password: e.target.value })
          }
          className="border p-2 mb-2 w-full"
          required
        />

        {/* Submit Button */}
        <button
          type="submit"
          className="bg-green-500 text-white px-4 py-2 w-full"
        >
          Register
        </button>
      </form>

      {/* Message Feedback */}
      {message && (
        <p className={`mt-2 ${error ? 'text-red-500' : 'text-green-500'}`}>
          {message}
        </p>
      )}
    </div>
  );
}