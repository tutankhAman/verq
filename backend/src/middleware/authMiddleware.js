const admin = require('../config/firebaseadmin');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            console.error('No token provided in request');
            return res.status(401).json({
                status: 'error',
                message: 'No token provided'
            });
        }

        const token = authHeader.split('Bearer ')[1];
        
        try {
            // Try to verify as JWT first
            try {
                console.log('Attempting JWT verification');
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                const user = await User.findById(decoded.id);
                if (!user) {
                    console.error('User not found for JWT token:', decoded.id);
                    return res.status(401).json({
                        status: 'error',
                        message: 'User no longer exists'
                    });
                }
                console.log('JWT authentication successful for user:', user._id);
                req.user = user;
                return next();
            } catch (jwtError) {
                console.log('JWT verification failed, attempting Firebase token verification');
                // If JWT verification fails, try Firebase token
                const decodedToken = await admin.auth().verifyIdToken(token);
                const user = await User.findOne({ uid: decodedToken.uid });
                if (!user) {
                    console.error('User not found for Firebase UID:', decodedToken.uid);
                    return res.status(401).json({
                        status: 'error',
                        message: 'User not found'
                    });
                }
                console.log('Firebase authentication successful for user:', user._id);
                req.user = user;
                return next();
            }
        } catch (error) {
            console.error('Token verification failed:', {
                error: error.message,
                stack: error.stack
            });
            return res.status(401).json({
                status: 'error',
                message: 'Invalid token'
            });
        }
    } catch (error) {
        console.error('Auth middleware error:', {
            error: error.message,
            stack: error.stack
        });
        return res.status(500).json({
            status: 'error',
            message: 'Internal server error'
        });
    }
};

module.exports = authMiddleware; 