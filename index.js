const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0'; // Bind to all network interfaces

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

// Serve static files
app.use(express.static(staticPath));

// Handle all routes by serving index.html (SPA support)
app.get('*', (req, res) => {
  res.sendFile(indexPath);
});

app.listen(PORT, HOST, () => {
  console.log(`Server running on ${HOST}:${PORT}`);
});
