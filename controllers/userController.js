const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const client = require('../config/db');

// Use a hardcoded secret key (or load from environment variable)
const jwtSecret = process.env.JWT_SECRET || '@StayAwake1!';

// User registration function
const registerUser = (req, res) => {
    const { username, email, password } = req.body;

    client.query('SELECT * FROM users WHERE email = $1', [email], (err, result) => {
        if (err) {
            return res.status(500).json({ message: 'Database error' });
        }

        if (result.rows.length > 0) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const hashedPassword = bcrypt.hashSync(password, 10);

        client.query(
            'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id, username, email',
            [username, email, hashedPassword],
            (err, result) => {
                if (err) {
                    return res.status(500).json({ message: 'Database error' });
                }

                const newUser = result.rows[0];
                res.status(201).json({
                    message: 'User registered successfully',
                    user: newUser
                });
            }
        );
    });
};

// User login function
const loginUser = (req, res) => {
    const { email, password } = req.body;

    client.query('SELECT * FROM users WHERE email = $1', [email], (err, result) => {
        if (err) {
            return res.status(500).json({ message: 'Database error' });
        }

        if (result.rows.length === 0) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const user = result.rows[0];
        const isMatch = bcrypt.compareSync(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Generate a JWT token using the secret key
        const token = jwt.sign({ id: user.id }, jwtSecret, { expiresIn: '1h' });

        res.json({
            message: 'Login successful',
            token: token,
            user: { id: user.id, username: user.username, email: user.email }
        });
    });
};

// Update user profile function
const updateUserProfile = (req, res) => {
    const userId = req.user.id; // Get user ID from the token
    const { username, email, password } = req.body;

    // Hash the new password if provided
    const hashedPassword = password ? bcrypt.hashSync(password, 10) : undefined;

    // Update user details in the database
    client.query(
        `UPDATE users SET 
            username = COALESCE($1, username), 
            email = COALESCE($2, email), 
            password = COALESCE($3, password) 
        WHERE id = $4 RETURNING id, username, email`,
        [username, email, hashedPassword, userId],
        (err, result) => {
            if (err) {
                return res.status(500).json({ message: 'Database error' });
            }

            const updatedUser = result.rows[0];
            res.json({
                message: 'User profile updated successfully',
                user: updatedUser
            });
        }
    );
};

module.exports = { registerUser, loginUser, updateUserProfile };
