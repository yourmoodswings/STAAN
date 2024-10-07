// config/db.js
const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_URL, // Use DATABASE_URL from env
  ssl: {
    rejectUnauthorized: false, // Required for Render's managed PostgreSQL
  },
});

client.connect()
  .then(() => console.log('Connected to PostgreSQL'))
  .catch(err => console.error('Connection error', err.stack));

module.exports = client;
