const { Deepgram } = require('@deepgram/sdk');
const { config } = require('../config/config');

/**
 * Convert speech to text using Deepgram, preserving filler words and punctuation
 * @param {Buffer} audioBuffer - Audio file buffer
 * @param {Object} options - Additional configuration options
 * @returns {Promise<string>} - Transcribed text with filler words and punctuation
 */
async function speechToText(audioBuffer, options = {}) {
  // Initialize Deepgram with the API key
  const deepgram = new Deepgram(config.deepgram.apiKey);

  try {
    // Create the source object
    const source = {
      buffer: audioBuffer,
      mimetype: 'audio/mp3'
    };

    // Create the transcription options
    const transcriptionOptions = {
      // Basic settings
      model: 'nova-2',
      language: 'en-US',
      smart_format: true,
      
      // Speech recognition settings
      utterances: true,
      utterance_end_ms: 1000,
      vad_events: true,
      
      // Filler word settings
      filler_words: true,
      filler_words_confidence: 0.1, // Lower threshold to catch more filler words
      
      // Punctuation settings
      punctuate: true,
      punctuation_confidence: 0.1, // Lower threshold to catch more punctuation
      
      // Formatting settings
      numerals: true,
      paragraphs: true,
      diarize: false,
      
      // Audio processing settings
      sample_rate: 16000,
      channels: 1,
      
      // Additional options
      ...options
    };

    // Call the transcription API
    const response = await deepgram.transcription.preRecorded(source, transcriptionOptions);
    
    // Extract the transcript
    const transcript = response.results?.channels[0]?.alternatives[0]?.transcript || '';
    
    // Post-process the transcript
    let formattedTranscript = transcript
      // Fix spacing around punctuation
      .replace(/\s+([.,!?])/g, '$1') // Remove space before punctuation
      .replace(/([.,!?])\s+/g, '$1 ') // Ensure single space after punctuation
      .replace(/\s*-\s*/g, '-') // Fix spacing around dashes
      .replace(/\s*,\s*/g, ', ') // Ensure proper comma spacing
      // Fix spacing around filler words
      .replace(/\s+(uh|um|ah|er|hm|hmm|uhm)\s+/g, ' $1 ') // Ensure space around common filler words
      // Fix multiple spaces
      .replace(/\s+/g, ' ')
      .trim();

    return formattedTranscript;
  } catch (error) {
    console.error('Error in speech to text conversion:', error);
    throw error;
  }
}

module.exports = {
  speechToText
}; 