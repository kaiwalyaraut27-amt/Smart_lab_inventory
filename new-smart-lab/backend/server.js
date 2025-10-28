// backend/server.js
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const { errorHandler } = require('./middlewares/errorMiddleware');

dotenv.config();

const app = express();

// Basic middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// DEBUG: see route types
const routesToTest = [
  'authRoutes',
  'userRoutes',
  'subjectRoutes',
  'labRoutes',
  'itemRoutes',
  'requestRoutes',
  'recordRoutes',
  'reportRoutes'
];

for (const r of routesToTest) {
  try {
    const mod = require(`./routes/${r}`);
    console.log(`${r} =>`, typeof mod);
  } catch (err) {
    console.error(`Failed to load ${r}:`, err.message);
  }
}

// ✅ Mount routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/subjects', require('./routes/subjectRoutes'));
app.use('/api/labs', require('./routes/labRoutes'));
app.use('/api/items', require('./routes/itemRoutes'));
app.use('/api/requests', require('./routes/requestRoutes'));
app.use('/api/records', require('./routes/recordRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));

// Temporary debug routes (only in non-production)
if (process.env.NODE_ENV !== 'production') {
  try {
    app.use('/api/debug', require('./routes/debugRoutes'));
    console.log('debugRoutes mounted at /api/debug');
  } catch (e) {
    console.warn('Could not mount debugRoutes:', e.message);
  }
}

// ✅ Test route
app.get('/', (req, res) => {
  res.send('Backend API is running!');
});

// ✅ Global error handler
app.use(errorHandler);

// ✅ KEEP SERVER RUNNING
const PORT = process.env.PORT || 5050;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
