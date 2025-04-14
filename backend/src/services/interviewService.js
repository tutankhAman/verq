const Interview = require('../models/Interview');
const User = require('../models/User');
const { processPDF } = require('./pdfService');

/**
 * Creates a new interview instance with extracted resume text
 * @param {string} userId - The Firebase UID of the user creating the interview
 * @param {string} jobRole - The job role for the interview
 * @param {string} resumeText - The extracted resume text
 * @returns {Promise<Object>} - The created interview document
 */
async function createInterview(userId, jobRole, resumeText) {
  try {
    console.log('Creating interview for user:', userId);
    
    // Find the user by Firebase UID
    const user = await User.findOne({ uid: userId });
    if (!user) {
      console.error('User not found for UID:', userId);
      throw new Error('User not found');
    }

    console.log('Found user:', user._id);

    const interview = new Interview({
      user: user._id, // Use MongoDB _id from the found user
      jobRole,
      resumeText,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await interview.save();
    console.log('Interview created successfully:', interview._id);
    return interview;
  } catch (error) {
    console.error('Error in createInterview:', {
      userId,
      jobRole,
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
}

/**
 * Gets all interviews for a user
 * @param {string} userId - The Firebase UID of the user
 * @returns {Promise<Array>} - Array of interview documents
 */
async function getUserInterviews(userId) {
  try {
    console.log('Fetching interviews for user:', userId);
    
    // Find the user by Firebase UID
    const user = await User.findOne({ uid: userId });
    if (!user) {
      console.error('User not found for UID:', userId);
      throw new Error('User not found');
    }
    
    const interviews = await Interview.find({ user: user._id })
      .sort({ createdAt: -1 })
      .exec();
    
    console.log(`Found ${interviews.length} interviews for user:`, userId);
    return interviews;
  } catch (error) {
    console.error('Error in getUserInterviews:', {
      userId,
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
}

/**
 * Updates interview status
 * @param {string} interviewId - The MongoDB _id of the interview
 * @param {string} status - New status
 * @returns {Promise<Object>} - Updated interview document
 */
async function updateInterviewStatus(interviewId, status) {
  try {
    console.log('Updating interview status:', { interviewId, status });
    
    const interview = await Interview.findByIdAndUpdate(
      interviewId,
      { 
        status,
        updatedAt: new Date()
      },
      { new: true }
    );
    
    if (!interview) {
      console.error('Interview not found:', interviewId);
      throw new Error('Interview not found');
    }
    
    console.log('Interview status updated successfully:', interviewId);
    return interview;
  } catch (error) {
    console.error('Error in updateInterviewStatus:', {
      interviewId,
      status,
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
}

/**
 * Adds a question and answer to the interview
 * @param {string} interviewId - The MongoDB _id of the interview
 * @param {string} question - The question text
 * @param {string} answer - The answer text
 * @param {Object} evaluation - The evaluation object
 * @returns {Promise<Object>} - Updated interview document
 */
async function addQuestionAnswer(interviewId, question, answer, evaluation) {
  try {
    console.log('Adding question and answer to interview:', interviewId);
    
    const interview = await Interview.findByIdAndUpdate(
      interviewId,
      {
        $push: {
          questions: {
            question,
            answer,
            evaluation,
            timestamp: new Date()
          }
        },
        updatedAt: new Date()
      },
      { new: true }
    );
    
    if (!interview) {
      console.error('Interview not found:', interviewId);
      throw new Error('Interview not found');
    }
    
    console.log('Question and answer added successfully to interview:', interviewId);
    return interview;
  } catch (error) {
    console.error('Error in addQuestionAnswer:', {
      interviewId,
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
}

/**
 * Completes the interview and saves the overall evaluation
 * @param {string} interviewId - The MongoDB _id of the interview
 * @param {Object} overallEvaluation - The overall evaluation object
 * @returns {Promise<Object>} - Updated interview document
 */
async function completeInterview(interviewId, overallEvaluation) {
  try {
    console.log('Completing interview and saving overall evaluation:', interviewId);
    
    const interview = await Interview.findByIdAndUpdate(
      interviewId,
      {
        status: 'completed',
        overallEvaluation,
        updatedAt: new Date()
      },
      { new: true }
    );
    
    if (!interview) {
      console.error('Interview not found:', interviewId);
      throw new Error('Interview not found');
    }
    
    console.log('Interview completed successfully:', interviewId);
    return interview;
  } catch (error) {
    console.error('Error in completeInterview:', {
      interviewId,
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
}

module.exports = {
  createInterview,
  getUserInterviews,
  updateInterviewStatus,
  addQuestionAnswer,
  completeInterview
}; 