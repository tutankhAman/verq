const mongoose = require('mongoose');

const interviewSchema = new mongoose.Schema({
  // Reference to the user who created the interview
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Job role for the interview
  jobRole: {
    type: String,
    required: true
  },
  // Extracted resume text
  resumeText: {
    type: String,
    required: true
  },
  // Status of the interview
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  // Questions and answers
  questions: [{
    question: String,
    answer: String,
    evaluation: {
      score: Number,
      feedback: String
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  // Timestamps
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
interviewSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Create indexes
interviewSchema.index({ user: 1 });
interviewSchema.index({ status: 1 });

const Interview = mongoose.model('Interview', interviewSchema);

module.exports = Interview; 