const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from the docs directory
app.use(express.static(path.join(__dirname, 'docs')));

// Serve the docs index.html for all routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'docs', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Documentation available at http://localhost:${PORT}`);
});
