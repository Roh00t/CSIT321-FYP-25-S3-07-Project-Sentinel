// App.tsx — simplified and corrected

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import PricingPlansPage from './pages/PricingPlansPage';
import RoleProtectedRoute from './components/RoleProtectedRoute';
import PageNotFoundPage from './pages/PageNotFoundPage';
import AlertsPage from './pages/alertPage';
import AdminProfilePage from './pages/AdminProfilePage';
import AdminEditProfilePage from './pages/AdminEditProfilePage';
import AppUserProfilePage from './pages/AppUserProfilePage';
import AppUserEditProfilePage from './pages/AppUserEditProfilePage';
import AdminManageUserPage from './pages/AdminManageUserPage';
import AppUserBasicAlertPage from './pages/AppUserBasicAlertPage';
import PlanProtectedRoute from './components/PlanProtectedRoute';
import ManagePlanPage from './pages/ManagePlanPage';
import CheckEmailPage from './pages/CheckEmailPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import VerifyAdminEmailPage from './pages/VerifyAdminEmailPage';
import DashboardLayoutSettingsPage from './pages/DashboardLayoutSettingsPage';

// Wrapper for /app/alerts that shows correct page based on plan
function AlertsRouter() {
  const plan = localStorage.getItem('plan_type');
  if (plan === 'Basic') {
    return <AppUserBasicAlertPage />;
  } else if (plan === 'Pro' || plan === 'Team') {
    return <AlertsPage />;
  }
  // Fallback: redirect if unknown plan (should not happen)
  return <Navigate to="/app/profile" />;
}

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
            <Route index element={<Navigate to="profile" />} />
            <Route path="profile" element={<AdminProfilePage />} />
            <Route path="profile/edit" element={<AdminEditProfilePage />} />
            <Route path="users" element={<AdminManageUserPage />} />
          </Route>

          {/* App User Routes */}
          <Route
            path="/app/*"
            element={<RoleProtectedRoute allowedRoles={['app_user']} />}
          >
            <Route path="dashboard" element={<Navigate to="/dashboard" />} />
            <Route path="alerts" element={<AlertsRouter />} />
            <Route path="profile" element={<AppUserProfilePage />} />
            <Route path="profile/edit" element={<AppUserEditProfilePage />} />
            <Route path="plan" element={<ManagePlanPage />} />
            
            {/* Layout settings — only for Pro/Team */}
            <Route
              path="dashboard-layout"
              element={
                <PlanProtectedRoute allowedPlans={['Pro', 'Team']} />
              }
            >
              <Route index element={<DashboardLayoutSettingsPage />} />
            </Route>
          </Route>

          {/* Unified /dashboard redirect */}
          <Route
            path="*/dashboard"
            element={
              (() => {
                const userType = localStorage.getItem('user_type');
                const userPlan = localStorage.getItem('plan_type');
                if (userType === 'admin') {
                  return <Navigate to="/admin/profile" />;
                } else if (userType === 'app_user') {
                  return <Navigate to="/app/alerts" />;
                }
                return <Navigate to="/login" />;
              })()
            }
          />

          {/* 404 */}
          <Route path="*" element={<PageNotFoundPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;