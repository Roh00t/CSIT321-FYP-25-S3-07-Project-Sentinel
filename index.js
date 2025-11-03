const express = require('express');
const path = require('path');
const fs = require('fs');
const { createProxyMiddleware } = require('http-proxy-middleware');
const { spawn } = require('child_process');

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';
const FLASK_PORT = 5000;

// Start Flask backend
console.log('Starting Flask backend...');
const flaskProcess = spawn('python', ['backend/run.py'], {
  env: { ...process.env, PORT: FLASK_PORT },
  stdio: 'inherit'
});

flaskProcess.on('error', (err) => {
  console.error('Failed to start Flask:', err);
});

// Check if frontend/dist exists, otherwise serve docs
const frontendDist = path.join(__dirname, 'frontend', 'dist');
const docsPath = path.join(__dirname, 'docs');

let staticPath = docsPath;
let indexPath = path.join(docsPath, 'index.html');

if (fs.existsSync(frontendDist)) {
  staticPath = frontendDist;
  indexPath = path.join(frontendDist, 'index.html');
  console.log('Serving React frontend from frontend/dist');
} else {
  console.log('Frontend build not found, serving docs instead');
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// Proxy API requests to Flask backend
app.use('/api', createProxyMiddleware({
  target: `http://localhost:${FLASK_PORT}`,
  changeOrigin: true,
  logLevel: 'debug'
}));

app.use('/socket.io', createProxyMiddleware({
  target: `http://localhost:${FLASK_PORT}`,
  changeOrigin: true,
  ws: true
}));

// Serve static files
app.use(express.static(staticPath));

// Handle all routes by serving index.html (SPA support)
app.get('*', (req, res) => {
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('Application not built. Run npm run build first.');
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  flaskProcess.kill('SIGTERM');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  flaskProcess.kill('SIGINT');
  process.exit(0);
});

app.listen(PORT, HOST, () => {
  console.log(`Server running on ${HOST}:${PORT}`);
  console.log(`Flask backend on port ${FLASK_PORT}`);
}).on('error', (err) => {
  console.error('Server error:', err);
  process.exit(1);
});
