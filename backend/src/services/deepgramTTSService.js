const axios = require('axios');
const fs = require('fs').promises;
const { config } = require('../config/config');

/**
 * Convert text to speech using Deepgram's TTS service
 * @param {string} text - The text to convert to speech
 * @param {string} outputPath - Where to save the audio file
 * @param {Object} options - Additional configuration options
 * @returns {Promise<string>} - Path to the generated audio file
 */
async function textToSpeech(text, outputPath, options = {}) {
  try {
    // Default options
    const defaultOptions = {
      model_id: 'aura-asteria-en',
      encoding: 'mp3',
      container: 'mp3',
      sample_rate: 24000
    };

    // Merge with provided options
    const requestOptions = { ...defaultOptions, ...options };

    // Call Deepgram TTS API
    const response = await axios({
      method: 'POST',
      url: 'https://api.deepgram.com/v1/speak',
      headers: {
        'Authorization': `Token ${config.deepgram.apiKey}`,
        'Content-Type': 'application/json'
      },
      data: {
        text: text,
        model_id: requestOptions.model_id,
        encoding: requestOptions.encoding,
        container: requestOptions.container,
        sample_rate: requestOptions.sample_rate
      },
      responseType: 'arraybuffer'
    });

    // Convert the audio data to a buffer
    const audioBuffer = Buffer.from(response.data);

    // Ensure the output directory exists
    const outputDir = outputPath.substring(0, outputPath.lastIndexOf('/'));
    await fs.mkdir(outputDir, { recursive: true });

    // Write the audio file
    await fs.writeFile(outputPath, audioBuffer);

    return outputPath;
  } catch (error) {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      const errorData = error.response.data.toString();
      console.error('Error response from Deepgram:', errorData);
      throw new Error(`Failed to convert text to speech: ${errorData}`);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received from Deepgram');
      throw new Error('Failed to receive response from Deepgram');
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error in Deepgram TTS:', error.message);
      throw new Error(`Failed to convert text to speech: ${error.message}`);
    }
  }
}

module.exports = {
  textToSpeech
}; 