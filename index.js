require('dotenv').config();
const express = require('express');
const session = require('express-session');
const PgSession = require('connect-pg-simple')(session);
const client = require('./config/db');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

// CORS setup
app.use(cors({
  origin: ['https://staan.onrender.com', 'http://localhost:3001'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true // Important for session handling with frontend
}));

// Import user-specific routes
const userRoutes = require('./routes/userRoutes');

app.use(express.json());
app.use(bodyParser.json());

// Configure session management with PostgreSQL store
app.use(
  session({
    store: new PgSession({
      pool: client,
      tableName: 'session',
    }),
    secret: process.env.SESSION_SECRET || '!DontStop!',
    resave: false, // Ensures the session is only saved if modified
    saveUninitialized: false, // Prevents uninitialized sessions from being saved
    cookie: {
      maxAge: 3600000, // 1 hour
      secure: true, // Only secure cookies in production
      httpOnly: true, // Prevent client-side JS from accessing cookies
      sameSite: 'none', // Required for cross-origin cookies (such as between frontend and backend)
    },
  })
);

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Route to check server status
app.get('/', (req, res) => {
  res.send('Backend server is running');
});

// Apply middleware for '/api' prefixed routes
app.use('/api/users', userRoutes);

// Final fallback for any other routes
app.use((req, res) => {
  if (!req.originalUrl.startsWith('/api')) {
    return res.status(404).send('Page not found.');
  }
  res.status(404).json({ message: 'API route not found.' });
});

// Error handler middleware (for better error reporting)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal Server Error' });
});

// Start server
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
