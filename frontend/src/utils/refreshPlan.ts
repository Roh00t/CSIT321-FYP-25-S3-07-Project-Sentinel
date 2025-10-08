// src/utils/refreshPlan.ts
export const refreshPlanFromBackend = async (): Promise<void> => {
  const token = localStorage.getItem('token');
  if (!token) return;

  try {
    const res = await fetch('http://localhost:5000/api/auth/verify-token', {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (res.ok) {
      const data = await res.json();
      localStorage.setItem('plan_type', data.subscription_plan);

      // ✅ Dispatch the custom event you're already listening for
      window.dispatchEvent(new Event('sessionchange'));
    }
  } catch (err) {
    console.error('Failed to refresh plan:', err);
  }
};