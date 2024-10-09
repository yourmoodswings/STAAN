require('dotenv').config();
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const axios = require('axios');
const querystring = require('querystring');
const authenticateToken = require('../middleware/authMiddleware');

// Helper function to get the frontend URL dynamically
const getFrontendUrl = () => {
    return process.env.NODE_ENV === 'production'
        ? 'https://staan.onrender.com'
        : 'http://localhost:3001';
};

// Route for user registration
router.post('/register', async (req, res) => {
    const { username, email, password } = req.body;

    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const query = `
            INSERT INTO users (username, email, password)
            VALUES ($1, $2, $3)
            RETURNING id, username, email;
        `;
        const values = [username, email, hashedPassword];
        const { rows } = await pool.query(query, values);

        res.status(201).json({ message: 'User registered successfully', user: rows[0] });
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Route for user login
router.post('/login', async (req, res) => {
    const { emailOrUsername, password } = req.body;

    try {
        const query = `SELECT * FROM users WHERE email = $1 OR username = $1;`;
        const values = [emailOrUsername];
        const { rows } = await pool.query(query, values);

        if (rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const user = rows[0];
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET || '@StayAwake+=1!', {
            expiresIn: '1h',
        });

        req.session.userId = user.id;
        req.session.save((err) => {
            if (err) {
                console.error('Error saving session:', err);
                return res.status(500).json({ message: 'Failed to save session' });
            }
            res.json({ token, user: { id: user.id, username: user.username, email: user.email } });
        });

    } catch (error) {
        console.error('Error logging in user:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Spotify Login
router.get('/spotify-login', (req, res) => {
    const scopes = 'user-read-private user-read-email playlist-read-private';
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const redirectUri = process.env.SPOTIFY_REDIRECT_URI;

    res.redirect(
        'https://accounts.spotify.com/authorize?' +
        querystring.stringify({
            response_type: 'code',
            client_id: clientId,
            scope: scopes,
            redirect_uri: redirectUri,
        })
    );
});

// Callback for Spotify token exchange
router.get('/callback', async (req, res) => {
    console.log('Session data during Spotify callback:', req.session); 
    try {
        const code = req.query.code;

        if (!code) {
            console.error('No authorization code provided.');
            return res.status(400).json({ message: 'No authorization code provided.' });
        }

        const tokenUrl = 'https://accounts.spotify.com/api/token';
        const clientId = process.env.SPOTIFY_CLIENT_ID;
        const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
        const redirectUri = process.env.SPOTIFY_REDIRECT_URI;

        const data = {
            code: code,
            redirect_uri: redirectUri,
            grant_type: 'authorization_code',
        };

        const headers = {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64'),
        };

        const response = await axios.post(tokenUrl, querystring.stringify(data), {
            headers,
            withCredentials: true // Ensure session cookie is sent with the request
        });
        const { access_token, refresh_token, expires_in } = response.data;
        console.log('Received Spotify tokens:', { access_token, refresh_token, expires_in });

        const userId = req.session?.userId;

        if (!userId) {
            console.error('User session missing.');
            req.session.destroy();
            return res.status(400).json({ message: 'User session missing. Please log in again.' });
        }

        const spotifyTokenExpiresAt = new Date(Date.now() + expires_in * 1000);

        const updateQuery = `
            UPDATE users
            SET spotify_access_token = $1,
                spotify_refresh_token = $2,
                spotify_token_expires_at = $3,
                platform_connected = 'spotify',
                is_spotify_connected = true
            WHERE id = $4
            RETURNING id, username, email;
        `;
        const updateValues = [access_token, refresh_token, spotifyTokenExpiresAt, userId];

        const result = await pool.query(updateQuery, updateValues);

        if (result.rows.length === 0) {
            console.error('User not found during database update.');
            return res.status(404).json({ message: 'User not found' });
        }

        req.session.save((err) => {
            if (err) {
                console.error('Error saving session during Spotify callback:', err);
                return res.status(500).json({ message: 'Failed to save session' });
            }
            res.redirect(`${getFrontendUrl()}/${result.rows[0].username}`);
        });

    } catch (error) {
        console.error('Error during Spotify token exchange:', error.message);
        res.status(500).json({ message: 'Token exchange failed' });
    }
});

// Fetch user profile
router.get('/profile', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const query = `
            SELECT id, username, email, spotify_access_token, spotify_refresh_token, is_spotify_connected 
            FROM users WHERE id = $1;
        `;
        const values = [userId];

        const { rows } = await pool.query(query, values);

        if (rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({
            user: {
                id: rows[0].id,
                username: rows[0].username,
                email: rows[0].email,
                spotifyAccessToken: rows[0].spotify_access_token,
                spotifyRefreshToken: rows[0].spotify_refresh_token,
                isSpotifyConnected: rows[0].is_spotify_connected
            }
        });
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;
