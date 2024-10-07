const jwt = require('jsonwebtoken');

function verifyToken(req, res, next) {
    const authHeader = req.headers['authorization'];

    console.log('Received headers:', req.headers);

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.error(`Authorization header is missing or incorrect format on route: ${req.originalUrl}`);
        return res.status(403).json({ message: 'Authorization header missing or incorrect format' });
    }

    const token = authHeader.split(' ')[1];

    jwt.verify(token, process.env.JWT_SECRET || 'default_secret_key', (err, decoded) => {
        if (err) {
            console.error('Token verification error:', err.message);
            if (err.name === 'TokenExpiredError') {
                return res.status(401).json({ message: 'Token expired, please log in again' });
            }
            return res.status(401).json({ message: 'Invalid or expired token' });
        }

        req.user = decoded;
        console.log('Token verification successful:', decoded);
        next();
    });
}

module.exports = verifyToken;
