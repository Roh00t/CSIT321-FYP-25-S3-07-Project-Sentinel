// Helper to notify components that session changed
const notifySessionChange = () => {
  window.dispatchEvent(new Event('sessionchange'));
};

export default notifySessionChange;