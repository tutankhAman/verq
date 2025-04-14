const express = require('express');
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/google', authController.googleAuth);
router.post('/github', authController.githubAuth);
router.post('/firebase', authController.firebaseAuth);

// Verify token and get user data
router.get('/verify', authMiddleware, async (req, res) => {
    try {
        res.status(200).json({
            status: 'success',
            data: {
                user: req.user
            }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

module.exports = router; 