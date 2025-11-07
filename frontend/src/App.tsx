// frontend/src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import PricingPlansPage from './pages/PricingPlansPage';
import RoleProtectedRoute from './components/RoleProtectedRoute';
import PlanProtectedRoute from './components/PlanProtectedRoute';
import PageNotFoundPage from './pages/PageNotFoundPage';

// Admin pages
import AdminDashboard from './pages/AdminDashboard';
import AdminProfilePage from './pages/AdminProfilePage';
import AdminEditProfilePage from './pages/AdminEditProfilePage';
import AdminManageUserPage from './pages/AdminManageUserPage';

// App user pages
import AppDashboard from './pages/AppDashboard';
import AppUserProfilePage from './pages/AppUserProfilePage';
import AppUserEditProfilePage from './pages/AppUserEditProfilePage';
import AppUserBasicAlertPage from './pages/AppUserBasicAlertPage';
import AlertsPage from './pages/alertPage';
import ManagePlanPage from './pages/ManagePlanPage';
import DashboardLayoutSettingsPage from './pages/DashboardLayoutSettingsPage';

// Auth flow
import CheckEmailPage from './pages/CheckEmailPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import VerifyAdminEmailPage from './pages/VerifyAdminEmailPage';

// Smart alert page
import ProtectedAlertsPage from './pages/ProtectedAlertsPage';

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
          <Route path="/check-email" element={<CheckEmailPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/verify-admin-email" element={<VerifyAdminEmailPage />} />

          {/* Admin Routes */}
          <Route
            path="/admin/*"
            element={<RoleProtectedRoute allowedRoles={['admin']} />}
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="profile" element={<AdminProfilePage />} />
            <Route path="profile/edit" element={<AdminEditProfilePage />} />
            <Route path="users" element={<AdminManageUserPage />} />
          </Route>

          {/* App User Routes */}
          <Route
            path="/app/*"
            element={<RoleProtectedRoute allowedRoles={['app_user']} />}
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AppDashboard />} />

            {/* Unified alerts route */}
            <Route path="alerts" element={<ProtectedAlertsPage />} />

            {/* Layout settings (Pro/Team only) */}
            <Route
              path="dashboard-layout"
              element={
                <PlanProtectedRoute allowedPlans={['Pro', 'Team']}>
                  <DashboardLayoutSettingsPage />
                </PlanProtectedRoute>
              }
            />

            <Route path="profile" element={<AppUserProfilePage />} />
            <Route path="profile/edit" element={<AppUserEditProfilePage />} />
            <Route path="plan" element={<ManagePlanPage />} />
          </Route>

          {/* Optional: top-level /dashboard redirect for convenience */}
          <Route
            path="/dashboard"
            element={
              localStorage.getItem('user_type') === 'admin' ? (
                <Navigate to="/admin/dashboard" replace />
              ) : localStorage.getItem('user_type') === 'app_user' ? (
                <Navigate to="/app/dashboard" replace />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          {/* 404 Route — MUST be last */}
          <Route path="*" element={<PageNotFoundPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;