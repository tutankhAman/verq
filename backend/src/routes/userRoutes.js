const express = require('express');
const { createOrUpdateUser, getUserProfile } = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Protected route - only accessible with valid Firebase token
router.post('/save', authMiddleware, createOrUpdateUser);

// Get user profile
router.get('/profile', authMiddleware, getUserProfile);

module.exports = router; 