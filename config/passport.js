// In a new file config/passport.js
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const pool = require('./db'); // Adjust path as necessary
const jwt = require('jsonwebtoken');

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
        const email = profile.emails[0].value;
        const query = `SELECT * FROM users WHERE email = $1;`;
        const { rows } = await pool.query(query, [email]);

        let user;
        if (rows.length === 0) {
            const insertQuery = `
                INSERT INTO users (username, email, platform_connected)
                VALUES ($1, $2, 'google')
                RETURNING id, username, email;
            `;
            const insertValues = [profile.displayName, email];
            const insertResult = await pool.query(insertQuery, insertValues);
            user = insertResult.rows[0];
        } else {
            user = rows[0];
        }

        return done(null, user);
    } catch (error) {
        console.error('Error in Google strategy:', error);
        return done(error, null);
    }
  }
));

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const query = `SELECT * FROM users WHERE id = $1;`;
        const { rows } = await pool.query(query, [id]);
        done(null, rows[0]);
    } catch (error) {
        done(error, null);
    }
});

module.exports = passport;
