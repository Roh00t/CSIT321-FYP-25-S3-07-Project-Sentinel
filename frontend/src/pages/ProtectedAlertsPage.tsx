// frontend/src/pages/ProtectedAlertsPage.tsx
import { Navigate } from 'react-router-dom';
import { usePlan } from '../hooks/usePlan';
import AppUserBasicAlertPage from './AppUserBasicAlertPage';
import AlertsPage from './alertPage';

export default function ProtectedAlertsPage() {
  const plan = usePlan();

  if (!plan) {
    // Plan not loaded yet — show nothing or loader (optional)
    // Or redirect if you prefer
    return <Navigate to="/app/profile" replace />;
  }

  if (plan === 'Basic') {
    return <AppUserBasicAlertPage />;
  }

  if (plan === 'Pro' || plan === 'Team') {
    return <AlertsPage />;
  }

  // Fallback
  return <Navigate to="/app/profile" replace />;
}