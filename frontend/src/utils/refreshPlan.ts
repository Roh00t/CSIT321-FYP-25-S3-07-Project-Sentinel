// src/utils/refreshPlan.ts
export const refreshPlanFromBackend = async (): Promise<void> => {
  const token = localStorage.getItem('token');
  if (!token) return;

  try {
  const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/verify-token`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (res.ok) {
      const data = await res.json();
      localStorage.setItem('plan_type', data.subscription_plan);

      // Dispatch the custom event
      window.dispatchEvent(new Event('sessionchange'));
    }
  } catch (err) {
    console.error('Failed to refresh plan:', err);
  }
};