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
import AdminProfilePage from './pages/AdminProfilePage';
import AdminEditProfilePage from './pages/AdminEditProfilePage';
import AdminManageUserPage from './pages/AdminManageUserPage';

// App user pages
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

// Smart alert page that respects plan (no localStorage read in router!)
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
            <Route index element={<Navigate to="profile" replace />} />
            <Route path="profile" element={<AdminProfilePage />} />
            <Route path="profile/edit" element={<AdminEditProfilePage />} />
            <Route path="users" element={<AdminManageUserPage />} />
          </Route>

          {/* App User Routes */}
          <Route
            path="/app/*"
            element={<RoleProtectedRoute allowedRoles={['app_user']} />}
          >
            {/* Redirect /app root to profile or alerts based on your logic elsewhere */}
            <Route index element={<Navigate to="profile" replace />} />

            {/* Unified alerts route — renders correct page based on plan */}
            <Route path="alerts" element={<ProtectedAlertsPage />} />

            {/* Plan-protected: layout settings only for Pro/Team */}
            <Route
              path="dashboard-layout"
              element={
                <PlanProtectedRoute allowedPlans={['Pro', 'Team']}>
                  <DashboardLayoutSettingsPage />
                </PlanProtectedRoute>
              }
            />

            {/* Profile & plan management */}
            <Route path="profile" element={<AppUserProfilePage />} />
            <Route path="profile/edit" element={<AppUserEditProfilePage />} />
            <Route path="plan" element={<ManagePlanPage />} />
          </Route>

          {/* Optional: catch-all redirect for logged-in users (but not using /dashboard) */}
          {/* If you really need a /dashboard alias, consider removing it per your preference */}

          {/* 404 Route — MUST be last */}
          <Route path="*" element={<PageNotFoundPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;