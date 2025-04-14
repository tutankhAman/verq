const path = require('path');
const fs = require('fs');
const { textToSpeech } = require('./services/deepgramTTSService');
const { generateInterviewQuestion } = require('./services/geminiService');
const { validateConfig } = require('./config/config');

// Validate environment variables
console.log('Validating environment variables...');
validateConfig();
console.log('Environment variables validated successfully.');

async function generateQuestionAndTTS() {
  try {
    console.log('Generating interview question using Gemini...');
    
    // Sample resume text for testing
    const sampleResumeText = `
      John Doe
      Software Engineer
      
      Skills: JavaScript, React, Node.js, Express, MongoDB, AWS
      
      Experience:
      - Senior Developer at TechCorp (2020-Present)
        - Led development of a microservices architecture
        - Implemented CI/CD pipelines using GitHub Actions
      
      Projects:
      - E-commerce Platform
        - Built with React, Node.js, and MongoDB
        - Implemented real-time inventory management
        - Integrated payment processing with Stripe
      
      Education:
      - BS Computer Science, University of Technology (2018)
    `;
    
    // Generate question using Gemini
    console.log('Calling Gemini to generate a question...');
    const question = await generateInterviewQuestion(sampleResumeText);
    console.log(`Generated question: "${question}"`);
    
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
    
    // Convert question to speech
    const outputPath = path.join(outputDir, 'question-tts-output.mp3');
    console.log(`Converting question to speech...`);
    console.log(`Output will be saved to: ${outputPath}`);
    
    // Convert text to speech
    console.log('Calling textToSpeech function...');
    const result = await textToSpeech(question, outputPath);
    
    console.log('Text-to-speech conversion completed successfully!');
    console.log(`Audio file saved to: ${result}`);
    
    // Verify the file exists
    if (fs.existsSync(result)) {
      const stats = fs.statSync(result);
      console.log(`File size: ${stats.size} bytes`);
    } else {
      console.error('Error: Output file was not created!');
    }
    
    return {
      question,
      audioPath: result
    };
  } catch (error) {
    console.error('Error generating question and TTS:', error.message);
    console.error('Stack trace:', error.stack);
    throw error;
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  console.log('Starting question generation and TTS test...');
  generateQuestionAndTTS()
    .then(result => {
      console.log('Test completed successfully.');
      console.log(`Question: "${result.question}"`);
      console.log(`Audio file: ${result.audioPath}`);
      process.exit(0);
    })
    .catch(error => {
      console.error('Test failed:', error);
      process.exit(1);
    });
}

module.exports = {
  generateQuestionAndTTS
}; 