const jwt = require('jsonwebtoken');

// Use the same secret key as in userController.js
const jwtSecret = process.env.JWT_SECRET || '@StayAwake+=1!';

const authenticateToken = (req, res, next) => {
    const token = req.header('Authorization').replace('Bearer ', '');
    console.log('Received Token:', token);  // Log the received token


    if (!token) {
        return res.status(401).json({ message: 'Access denied' });
    }

    try {
        const verified = jwt.verify(token, jwtSecret);
        req.user = verified;
        next();
    } catch (err) {
        res.status(400).json({ message: 'Invalid token' });
    }
};

module.exports = authenticateToken;
