const path = require('path');
const fs = require('fs');
const { textToSpeech } = require('./services/deepgramTTSService');
const { validateConfig } = require('./config/config');

// Validate environment variables
console.log('Validating environment variables...');
validateConfig();
console.log('Environment variables validated successfully.');

async function testTTS() {
  try {
    console.log('Testing Deepgram Text-to-Speech...');
    
    // Create output directory if it doesn't exist
    const outputDir = path.join(__dirname, 'output');
    console.log(`Checking output directory: ${outputDir}`);
    if (!fs.existsSync(outputDir)) {
      console.log('Output directory does not exist, creating it...');
      fs.mkdirSync(outputDir, { recursive: true });
      console.log('Output directory created successfully.');
    } else {
      console.log('Output directory already exists.');
    }
    
    // Test text
    const testText = "Hello! This is a test of the Deepgram Text-to-Speech service. How does my voice sound?";
    const outputPath = path.join(outputDir, 'test-tts-output.mp3');
    
    console.log(`Converting text: "${testText}"`);
    console.log(`Output will be saved to: ${outputPath}`);
    
    // Convert text to speech
    console.log('Calling textToSpeech function...');
    const result = await textToSpeech(testText, outputPath);
    
    console.log('Text-to-speech conversion completed successfully!');
    console.log(`Audio file saved to: ${result}`);
    
    // Verify the file exists
    if (fs.existsSync(result)) {
      const stats = fs.statSync(result);
      console.log(`File size: ${stats.size} bytes`);
    } else {
      console.error('Error: Output file was not created!');
    }
    
    return result;
  } catch (error) {
    console.error('Error testing TTS:', error.message);
    console.error('Stack trace:', error.stack);
    throw error;
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  console.log('Starting TTS test...');
  testTTS()
    .then(() => {
      console.log('Test completed successfully.');
      process.exit(0);
    })
    .catch(error => {
      console.error('Test failed:', error);
      process.exit(1);
    });
}

module.exports = {
  testTTS
}; 