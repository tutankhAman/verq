const fs = require('fs').promises;
const path = require('path');

/**
 * Mock text-to-speech service that creates an empty audio file
 * 
 * @param {string} text - The text to convert to speech
 * @param {string} outputPath - Where to save the audio file
 * @param {string} [voice='en'] - The voice to use (default: 'en')
 * @returns {Promise<string>} - Path to the generated audio file
 */
async function textToSpeech(text, outputPath, voice = 'en') {
    try {
        console.log(`[MOCK TTS] Converting text to speech: "${text.substring(0, 50)}..."`);
        
        // Ensure the output directory exists
        const outputDir = path.dirname(outputPath);
        await fs.mkdir(outputDir, { recursive: true });
        
        // Create an empty audio file (1 second of silence)
        const silenceBuffer = Buffer.alloc(44100 * 2); // 1 second of silence at 44.1kHz, 16-bit
        
        // Write the audio file
        await fs.writeFile(outputPath, silenceBuffer);
        
        console.log(`[MOCK TTS] Audio file created at: ${outputPath}`);
        return outputPath;
    } catch (error) {
        console.error('Error in mock text-to-speech:', error.message);
        throw error;
    }
}

module.exports = {
    textToSpeech
}; 