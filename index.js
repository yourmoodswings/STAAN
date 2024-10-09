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

// CORS setup for local development
app.use(cors({
  origin: 'http://localhost:3001',  // Set to the frontend's local port
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
      pool: client, // PostgreSQL client
      tableName: 'session',
    }),
    secret: process.env.SESSION_SECRET,  // Ensure you have this in your .env file
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60, // 1 hour
      secure: false, // Secure must be false for HTTP (local development)
      httpOnly: true,
      sameSite: 'none', // 'Lax' is fine for local dev, adjust if needed for cross-site requests
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
