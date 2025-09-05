export const logout = () => {
  localStorage.removeItem('token');
  window.location.href = '/login'; // or use navigate in context
};

// Optional: Check if token is expired (if using JWT)
export const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
};