const path = require('path');
const express = require('express');
const config = require('./config');
const paymentsRouter = require('./routes/payments');
const resumeRouter = require('./routes/resume');

const app = express();

// Basic body parsers for JSON/urlencoded; multer handles multipart where needed
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, '..', 'public')));

// API routes
app.use('/api/payments', paymentsRouter);
app.use('/api/resume', resumeRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Fallback for unknown API routes (optional)
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'NOT_FOUND', message: 'API endpoint not found.' });
});

app.listen(config.port, () => {
  console.log(`AI Resume Updater Web server running on port ${config.port}`);
});