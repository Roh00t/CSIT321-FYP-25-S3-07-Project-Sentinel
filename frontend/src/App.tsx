import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import { useState, FormEvent } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';

// ------------------ Register Component ------------------
function Register() {
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });
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
      const data = await res.json();

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
        <input
          placeholder="Username"
          value={formData.username}
          onChange={(e) => setFormData({ ...formData, username: e.target.value })}
          className="border p-2 mb-2 w-full"
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="border p-2 mb-2 w-full"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          className="border p-2 mb-2 w-full"
          required
        />
        <button type="submit" className="bg-green-500 text-white px-4 py-2 w-full">
          Register
        </button>
      </form>
      {message && (
        <p className={`mt-2 ${error ? 'text-red-500' : 'text-green-500'}`}>{message}</p>
      )}
    </div>
  );
}

// ------------------ Login Component ------------------
function Login({ setToken }: { setToken: (token: string) => void }) {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [message, setMessage] = useState<string | null>(null);

  const handleLogin = async () => {
    try {
      const res = await fetch('http://127.0.0.1:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.access_token) {
        setToken(data.access_token);
        localStorage.setItem('token', data.access_token);
        setMessage(null);
      } else {
        setMessage(data.msg || 'Login failed');
      }
    } catch (err) {
      setMessage('Network error');
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 border rounded shadow mt-6">
      <h2 className="text-2xl font-bold mb-4">Login</h2>
      <input
        placeholder="Username"
        value={formData.username}
        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
        className="border p-2 mb-2 w-full"
      />
      <input
        type="password"
        placeholder="Password"
        value={formData.password}
        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
        className="border p-2 mb-2 w-full"
      />
      <button onClick={handleLogin} className="bg-blue-500 text-white px-4 py-2 w-full">
        Login
      </button>
      {message && <p className="mt-2 text-red-500">{message}</p>}
    </div>
  );
}

// ------------------ Main App ------------------

function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');

  return (
    <Router>
      <div className="p-10">
        {/* Navbar */}
        <nav className="mb-6 flex space-x-6 text-white text-lg font-semibold sticky top-0 z-50 bg-gray-800 shadow-md px-6 py-4">
          <Link to="/">Home</Link>
          <Link to="/register">Register</Link>
          <Link to="/login">Login</Link>
        </nav>

        {/* Routes */}
        <Routes>
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login setToken={setToken} />} />
          <Route
            path="/"
            element={
              token ? (
                <div>
                  <div className="p-10">
                    <h1 className="text-4xl font-bold text-blue-600">Hello Tailwind!</h1>
                    <p className="text-gray-700 mt-2">If this is blue, Tailwind is working.</p>
                  </div>

                  <h1 className="text-2xl mb-4">IDS Dashboard</h1>
                  <p>Logged in! Token: {token.substring(0, 20)}...</p>
                </div>
              ) : (
                <div>
                  <div className="p-10">
                    <h1 className="text-4xl font-bold text-blue-600">Hello Tailwind!</h1>
                    <p className="text-gray-700 mt-2">If this is blue, Tailwind is working.</p>
                  </div>

                  <p>Please login or register</p>
                </div>
              )
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;