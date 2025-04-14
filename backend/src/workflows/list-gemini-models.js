const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

async function listGeminiModels() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('API key is not loaded from environment variables!');
    return;
  }
  
  // Mask the middle part of the key for security
  const maskedKey = apiKey.substring(0, 10) + '...' + apiKey.substring(apiKey.length - 4);
  console.log('Using Gemini API key:', maskedKey);
  
  // Create Gemini client
  const genAI = new GoogleGenerativeAI(apiKey);

  try {
    console.log('Attempting to list available Gemini models...');
    
    // List available models
    const models = await genAI.listModels();
    
    console.log('Available Gemini models:');
    console.log(JSON.stringify(models, null, 2));
  } catch (error) {
    console.error('\nError occurred:', error.message);
    console.error('Full error details:', JSON.stringify(error, null, 2));
  }
}

listGeminiModels(); 