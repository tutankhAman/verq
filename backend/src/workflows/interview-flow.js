const fs = require('fs');
const path = require('path');
const { processPDF } = require('../services/pdfService');
const { generateInterviewQuestion, evaluateAnswer, generateFollowUpQuestion } = require('../services/geminiService');
const { textToSpeech } = require('../services/textToSpeechService');
const { speechToText } = require('../services/deepgramService');
const { validateConfig } = require('../config/config');
const { createInterview, updateInterviewStatus, addQuestionAnswer } = require('../services/interviewService');

// Set environment variables
// process.env.GEMINI_API_KEY = 'AIzaSyDQekyR-NW55U8gWW_9Rzu_PojkivR0UA0';
// process.env.DEEPGRAM_API_KEY = '11a2141f6e93fc20f32d03b2932c32aefb1c6eeb';

// Validate environment variables
validateConfig();

/**
 * Main interview flow function
 * @param {string} userId - The ID of the user
 * @param {string} pdfPath - Path to the PDF resume file
 * @param {string} role - The role the candidate is applying for
 * @param {string} [audioPath] - Optional path to the audio response file
 * @returns {Promise<Object>} - The interview results
 */
async function runInterviewFlow(userId, pdfPath, role, audioPath = "C:\\Users\\amana\\Repos\\verq\\audio-sample.mp3") {
  let interview;
  try {
    // Read the PDF file
    const pdfBuffer = fs.readFileSync(pdfPath);

    // Create new interview instance with extracted resume text
    interview = await createInterview(userId, role, pdfBuffer);
    console.log(`Created new interview with ID: ${interview._id}`);

    // Update interview status to in_progress
    await updateInterviewStatus(interview._id, 'in_progress');

    // Generate initial question
    const currentQuestion = await generateInterviewQuestion(interview.resumeText, role);
    
    // Convert question to speech
    const questionAudioPath = path.join(path.dirname(audioPath), `question_${Date.now()}.mp3`);
    await textToSpeech(currentQuestion, questionAudioPath);

    // Process 5 questions
    for (let i = 0; i < 5; i++) {
      console.log(`\nQuestion ${i + 1}:`);
      console.log('----------------------------------------');
      console.log(currentQuestion);
      console.log('----------------------------------------');

      // Process the audio response
      console.log('\nProcessing audio response...');
      const responseBuffer = fs.readFileSync(audioPath);
      const transcript = await speechToText(responseBuffer);
      console.log('\nTranscribed Response:');
      console.log('----------------------------------------');
      console.log(transcript);
      console.log('----------------------------------------');

      // Evaluate the answer
      console.log('\nEvaluating answer...');
      const evaluation = await evaluateAnswer(currentQuestion, transcript);
      console.log('\nEvaluation Results:');
      console.log('----------------------------------------');
      console.log(JSON.stringify(evaluation, null, 2));
      console.log('----------------------------------------');

      // Save question, answer, and evaluation
      await addQuestionAnswer(interview._id, currentQuestion, transcript, evaluation);

      // Generate follow-up question if not the last question
      if (i < 4) {
        console.log('\nGenerating follow-up question...');
        const followUpQuestion = await generateFollowUpQuestion(
          interview.resumeText,
          currentQuestion,
          transcript,
          evaluation
        );
        currentQuestion = followUpQuestion;
      }
    }

    // Update interview status to completed
    await updateInterviewStatus(interview._id, 'completed');

    return {
      interviewId: interview._id,
      status: 'completed'
    };
  } catch (error) {
    // Update interview status to cancelled if there's an error
    if (interview) {
      await updateInterviewStatus(interview._id, 'cancelled');
    }
    console.error('Error in interview flow:', error.message);
    throw error;
  }
}

/**
 * Process an audio response using Deepgram
 * @param {string} audioPath - Path to the audio file
 * @returns {Promise<Object>} - The transcription results
 */
async function processAudioResponse(audioPath) {
  try {
    // Validate audio path
    if (!audioPath) {
      throw new Error('Please provide an audio file path');
    }
    if (!fs.existsSync(audioPath)) {
      throw new Error(`Audio file not found: ${audioPath}`);
    }

    // Create output directory if it doesn't exist
    const outputDir = path.join(__dirname, '..', 'output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Generate timestamp for unique filenames
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const originalFileName = path.basename(audioPath, path.extname(audioPath));

    // Convert response to text using Deepgram
    console.log('\nConverting response to text...');
    const responseBuffer = fs.readFileSync(audioPath);
    const transcript = await speechToText(responseBuffer);
    console.log('\nTranscribed Response:');
    console.log('----------------------------------------');
    console.log(transcript);
    console.log('----------------------------------------');

    // Save the transcript
    const transcriptPath = path.join(outputDir, `${originalFileName}_transcript_${timestamp}.txt`);
    fs.writeFileSync(transcriptPath, transcript);
    console.log(`\nTranscript saved to: ${transcriptPath}`);

    return {
      transcript,
      transcriptPath
    };
  } catch (error) {
    console.error('Error processing audio:', error.message);
    throw error;
  }
}

// If this file is run directly, execute the flow
if (require.main === module) {
  const userId = process.argv[2];
  const pdfPath = process.argv[3];
  const role = process.argv[4];
  const audioPath = process.argv[5] || "C:\\Users\\amana\\Repos\\verq\\audio-sample.mp3";
  runInterviewFlow(userId, pdfPath, role, audioPath)
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = {
  runInterviewFlow,
  processAudioResponse
}; 