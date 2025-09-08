// App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import PricingPlansPage from './pages/PricingPlansPage';
import AdminDashboard from './pages/AdminDashboard';
import AppDashboard from './pages/AppDashboard';
import RoleProtectedRoute from './components/RoleProtectedRoute';
import PageNotFoundPage from './pages/PageNotFoundPage';
import AlertsPage from './pages/alertPage';
import AdminProfilePage from './pages/AdminProfilePage';
import AdminEditProfilePage from './pages/AdminEditProfilePage';
import AppUserProfilePage from './pages/AppUserProfilePage';
import AppUserEditProfilePage from './pages/AppUserEditProfilePage';
import AdminManageUserPage from './pages/AdminManageUserPage';

function App() {
  return (
    <BrowserRouter>
      <div>
        <Navbar />
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/pricing" element={<PricingPlansPage />} />

          {/* Protected Admin Routes */}
          <Route
            path="/admin/*"
            element={<RoleProtectedRoute allowedRoles={['admin']} />}
          >
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="profile" element={<AdminProfilePage />} />
            <Route path="profile/edit" element={<AdminEditProfilePage />} />
            <Route path="users" element={<AdminManageUserPage />} />
          </Route>

          {/* Protected AppUser Routes */}
          <Route
            path="/app/*"
            element={<RoleProtectedRoute allowedRoles={['app_user']} />}
          >
            <Route path="dashboard" element={<AppDashboard />} />
            <Route path="alerts" element={<AlertsPage />} />
            <Route path="profile" element={<AppUserProfilePage />} />
            <Route path="profile/edit" element={<AppUserEditProfilePage />} />
          </Route>

          {/* Catch-all: Redirect logged-in users */}
          <Route
            path="/dashboard"
            element={
              localStorage.getItem('user_type') === 'admin' ? (
                <Navigate to="/admin/dashboard" />
              ) : (
                <Navigate to="/app/dashboard" />
              )
            }
          />

          {/* ✅ 404 Route — MUST be last */}
          <Route path="*" element={<PageNotFoundPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;