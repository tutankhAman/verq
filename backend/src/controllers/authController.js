const jwt = require('jsonwebtoken');
const User = require('../models/User');
const admin = require('../config/firebaseadmin');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  // Remove password from output
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user
    }
  });
};

const register = async (req, res) => {
  try {
    const { displayName, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        status: 'error',
        message: 'Email already in use'
      });
    }

    // Create new user
    const newUser = await User.create({
      displayName,
      email,
      password,
      authMethod: 'jwt',
      isEmailVerified: false
    });

    // Update last login
    await newUser.updateLastLogin();

    createSendToken(newUser, 201, res);
  } catch (error) {
    console.error('Registration error:', error);
    res.status(400).json({
      status: 'error',
      message: error.message || 'Registration failed'
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if email and password exist
    if (!email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide email and password'
      });
    }

    // Check if user exists && password is correct
    const user = await User.findOne({ email }).select('+password');
    
    if (!user || !(await user.correctPassword(password))) {
      return res.status(401).json({
        status: 'error',
        message: 'Incorrect email or password'
      });
    }

    createSendToken(user, 200, res);
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

const googleAuth = async (req, res) => {
  try {
    const { uid, email, name, photoURL } = req.body;

    // Check if user already exists
    let user = await User.findOne({ 
      $or: [
        { email },
        { uid }
      ]
    });

    if (!user) {
      // Create new user if doesn't exist
      user = await User.create({
        displayName: name,
        email,
        authMethod: 'google',
        uid,
        photoURL,
        isEmailVerified: true
      });
    } else if (user.authMethod !== 'google') {
      // If user exists but with different auth method
      return res.status(400).json({
        status: 'error',
        message: 'Email already registered with different authentication method'
      });
    } else {
      // Update existing Google user
      user.uid = uid;
      user.photoURL = photoURL;
      await user.save();
    }

    // Update last login
    await user.updateLastLogin();

    createSendToken(user, 200, res);
  } catch (error) {
    console.error('Google authentication error:', error);
    res.status(400).json({
      status: 'error',
      message: error.message || 'Google authentication failed'
    });
  }
};

const firebaseAuth = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'No token provided'
      });
    }

    // Verify Firebase token
    const decodedToken = await admin.auth().verifyIdToken(token);
    const { uid, email, name, picture } = decodedToken;

    // Check if user already exists
    let user = await User.findOne({ 
      $or: [
        { email },
        { uid }
      ]
    });

    if (!user) {
      // Create new user if doesn't exist
      user = await User.create({
        displayName: name,
        email,
        authMethod: 'firebase',
        uid,
        photoURL: picture,
        isEmailVerified: true
      });
    } else if (user.authMethod !== 'firebase') {
      // If user exists but with different auth method
      return res.status(400).json({
        status: 'error',
        message: 'Email already registered with different authentication method'
      });
    } else {
      // Update existing Firebase user
      user.uid = uid;
      user.photoURL = picture;
      await user.save();
    }

    // Update last login
    await user.updateLastLogin();

    createSendToken(user, 200, res);
  } catch (error) {
    console.error('Firebase authentication error:', error);
    res.status(401).json({
      status: 'error',
      message: 'Invalid Firebase token'
    });
  }
};

const githubAuth = async (req, res) => {
  try {
    const { uid, email, name, photoURL } = req.body;

    // Check if user already exists
    let user = await User.findOne({ 
      $or: [
        { email },
        { uid }
      ]
    });

    if (!user) {
      // Create new user if doesn't exist
      user = await User.create({
        displayName: name,
        email,
        authMethod: 'github',
        uid,
        photoURL,
        isEmailVerified: true
      });
    } else if (user.authMethod !== 'github') {
      // If user exists but with different auth method
      return res.status(400).json({
        status: 'error',
        message: 'Email already registered with different authentication method'
      });
    } else {
      // Update existing GitHub user
      user.uid = uid;
      user.photoURL = photoURL;
      await user.save();
    }

    // Update last login
    await user.updateLastLogin();

    createSendToken(user, 200, res);
  } catch (error) {
    console.error('GitHub authentication error:', error);
    res.status(400).json({
      status: 'error',
      message: error.message || 'GitHub authentication failed'
    });
  }
};

module.exports = {
  register,
  login,
  googleAuth,
  firebaseAuth,
  githubAuth
}; 