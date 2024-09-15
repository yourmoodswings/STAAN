const express = require('express');
const router = express.Router();
const { registerUser, loginUser, updateUserProfile } = require('../controllers/userController');
const authenticateToken = require('../middleware/authMiddleware');

// POST request for user registration
router.post('/register', registerUser);

// POST request for user login
router.post('/login', loginUser);

// GET request for user profile (secured)
router.get('/profile', authenticateToken, async (req, res) => {
    const userId = req.user.id;

    try {
        // Fetch the user's basic info (username, email, favorite artists)
        const userResult = await client.query(
            'SELECT username, email, favorite_artists FROM users WHERE id = $1',
            [userId]
        );
        const user = userResult.rows[0];

        // Fetch the user's recent reviews
        const reviewResult = await client.query(
            'SELECT song_name, artist_name, review FROM reviews WHERE user_id = $1 ORDER BY created_at DESC LIMIT 5',
            [userId]
        );

        // Ensure `recentReviews` is always an array
        const recentReviews = reviewResult.rows.length > 0 ? reviewResult.rows : [];

        // Respond with the user profile data
        res.json({
            user: {
                username: user.username,
                email: user.email,
                favoriteArtists: user.favorite_artists || [],  // Default to empty array if undefined
                recentReviews: recentReviews,  // Always send as an array, even if empty
            },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});


// PUT request to update user profile (secured)
router.put('/profile', authenticateToken, updateUserProfile);

module.exports = router;
