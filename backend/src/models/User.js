const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const validator = require('validator');

const userSchema = new mongoose.Schema({
  // Common fields for all auth methods
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email']
  },
  displayName: {
    type: String,
    required: true,
    trim: true
  },
  photoURL: {
    type: String,
    default: 'https://www.gravatar.com/avatar/?d=mp'
  },
  // Authentication fields
  uid: {
    type: String,
    sparse: true,
    unique: true
  },
  googleId: {
    type: String,
    sparse: true,
    unique: true
  },
  githubId: {
    type: String,
    sparse: true,
    unique: true
  },
  password: {
    type: String,
    select: false,
    minlength: [8, 'Password must be at least 8 characters long'],
    validate: {
      validator: function(password) {
        // Only require password for JWT users
        return this.authMethod === 'jwt' ? password.length >= 8 : true;
      },
      message: 'Password is required for email/password login'
    }
  },
  authMethod: {
    type: String,
    required: true,
    enum: ['jwt', 'google', 'github', 'firebase'],
    default: 'jwt'
  },
  // User data
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  lastLogin: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update timestamps
userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Hash password before saving (only for JWT users)
userSchema.pre('save', async function(next) {
  if (!this.isModified('password') || this.authMethod !== 'jwt') return next();
  
  try {
    this.password = await bcrypt.hash(this.password, 12);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to check if password is correct (for JWT users)
userSchema.methods.correctPassword = async function(candidatePassword) {
  if (this.authMethod !== 'jwt') return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to update last login
userSchema.methods.updateLastLogin = function() {
  this.lastLogin = Date.now();
  return this.save();
};

// Create indexes
userSchema.index({ email: 1 });
userSchema.index({ uid: 1 }, { sparse: true });
userSchema.index({ googleId: 1 }, { sparse: true });
userSchema.index({ githubId: 1 }, { sparse: true });

const User = mongoose.model('User', userSchema);

module.exports = User; 