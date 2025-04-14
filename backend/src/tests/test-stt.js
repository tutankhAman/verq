const fs = require('fs');
const path = require('path');
const { speechToText } = require('../services/deepgramService');

/**
 * Test different speech-to-text configurations
 * @param {string} audioPath - Path to the audio file
 * @param {Object} config - Configuration options to test
 */
async function testSTT(audioPath, config = {}) {
  try {
    // Validate audio path
    if (!audioPath) {
      throw new Error('Please provide an audio file path');
    }
    if (!fs.existsSync(audioPath)) {
      throw new Error(`Audio file not found: ${audioPath}`);
    }

    console.log('\nTesting Speech-to-Text with configuration:');
    console.log(JSON.stringify(config, null, 2));
    console.log('\nProcessing audio file:', audioPath);

    // Read the audio file
    const audioBuffer = fs.readFileSync(audioPath);

    // Process the audio
    const transcript = await speechToText(audioBuffer, config);

    // Display results
    console.log('\nTranscription Results:');
    console.log('----------------------------------------');
    console.log(transcript);
    console.log('----------------------------------------');

    // Save the transcript
    const outputDir = path.join(__dirname, '..', 'output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const originalFileName = path.basename(audioPath, path.extname(audioPath));
    const transcriptPath = path.join(outputDir, `${originalFileName}_test_${timestamp}.txt`);
    
    fs.writeFileSync(transcriptPath, transcript);
    console.log(`\nTranscript saved to: ${transcriptPath}`);

    return {
      transcript,
      transcriptPath
    };
  } catch (error) {
    console.error('Error in speech-to-text test:', error.message);
    throw error;
  }
}

// If this file is run directly, execute the test
if (require.main === module) {
  const audioPath = process.argv[2] || "C:\\Users\\amana\\Repos\\verq\\audio-sample.mp3";
  
  // Test configurations
  const configs = [
    {
      name: 'Default Configuration',
      config: {}
    },
    {
      name: 'High Sensitivity Filler Words',
      config: {
        filler_words: true,
        filler_words_confidence: 0.1,
        utterances: true,
        utterance_end_ms: 500
      }
    },
    {
      name: 'Enhanced Punctuation',
      config: {
        punctuate: true,
        punctuation_confidence: 0.1,
        smart_format: true,
        utterances: true,
        utterance_end_ms: 500
      }
    },
    {
      name: 'Combined High Sensitivity',
      config: {
        filler_words: true,
        filler_words_confidence: 0.1,
        punctuate: true,
        punctuation_confidence: 0.1,
        smart_format: true,
        utterances: true,
        utterance_end_ms: 500,
        vad_events: true
      }
    }
  ];

  // Run tests for each configuration
  async function runAllTests() {
    for (const { name, config } of configs) {
      console.log(`\n\n=== Testing ${name} ===`);
      try {
        await testSTT(audioPath, config);
      } catch (error) {
        console.error(`Error in ${name}:`, error.message);
      }
    }
  }

  runAllTests()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Test failed:', error);
      process.exit(1);
    });
}

module.exports = {
  testSTT
}; 