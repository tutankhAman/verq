const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

async function testGemini() {
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
    console.log('Attempting to generate content with Gemini...');
    
    // Use the gemini-2.0-flash model
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    
    const prompt = "Generate a simple technical interview question about JavaScript.";
    console.log('Prompt:', prompt);
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log('Gemini response successful!');
    console.log('Response:', text);
  } catch (error) {
    console.error('\nError occurred:', error.message);
    console.error('Full error details:', JSON.stringify(error, null, 2));

    if (error.message.includes('API key')) {
      console.log('\nAuthentication error. Please check:');
      console.log('1. The key is valid and not expired');
      console.log('2. The key has the correct permissions');
    } else if (error.message.includes('quota')) {
      console.log('\nQuota error. Please check:');
      console.log('1. Your Google Cloud Console for quota limits');
      console.log('2. Your billing settings are properly configured');
    }
  }
}

testGemini(); 