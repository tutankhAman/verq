require('dotenv').config();
const { runInterviewFlow } = require('./src/workflows/interview-flow');

// Set environment variables
process.env.GEMINI_API_KEY = 'AIzaSyDQekyR-NW55U8gWW_9Rzu_PojkivR0UA0';
process.env.DEEPGRAM_API_KEY = '11a2141f6e93fc20f32d03b2932c32aefb1c6eeb';

const pdfPath = "C:\\Users\\amana\\Repos\\verq\\Aman Aziz Resume.pdf";
const audioPath = "C:\\Users\\amana\\Repos\\verq\\audio-sample.mp3";

console.log('Starting interview flow...');
console.log('PDF Path:', pdfPath);
console.log('Audio Path:', audioPath);

runInterviewFlow(pdfPath, audioPath)
  .then(results => {
    console.log('\nInterview Flow Results:');
    console.log('----------------------------------------');
    console.log(JSON.stringify(results, null, 2));
    console.log('----------------------------------------');
  })
  .catch(error => {
    console.error('Error:', error);
    process.exit(1);
  }); 