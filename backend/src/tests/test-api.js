const OpenAI = require('openai');
require('dotenv').config();

async function testOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('API key is not loaded from environment variables!');
    return;
  }
  
  // Mask the middle part of the key for security
  const maskedKey = apiKey.substring(0, 10) + '...' + apiKey.substring(apiKey.length - 4);
  console.log('Using API key:', maskedKey);
  
  // Create OpenAI client with more detailed configuration
  const openai = new OpenAI({
    apiKey: apiKey,
    maxRetries: 0, // Disable retries for clearer error messages
  });

  try {
    console.log('Attempting to list available models first...');
    const models = await openai.models.list();
    console.log('Successfully connected to OpenAI API!');
    console.log('Available models:', models.data.map(m => m.id).slice(0, 5), '...');

    console.log('\nAttempting to make a chat completion...');
    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: "Say 'Hello, World!'" }],
      model: "gpt-3.5-turbo",
    });
    console.log('Chat completion successful! Response:', completion.choices[0].message.content);
  } catch (error) {
    console.error('\nError occurred:', error.message);
    console.error('Error type:', error.type);
    console.error('Full error details:', JSON.stringify(error, null, 2));

    if (error.status === 401) {
      console.log('\nAuthentication error. For service account keys, please check:');
      console.log('1. The key is valid and not expired');
      console.log('2. The service account has the correct permissions');
      console.log('3. Your organization settings allow service account access');
    } else if (error.status === 403) {
      console.log('\nAuthorization error. Please check:');
      console.log('1. Your service account has permission to access the OpenAI API');
      console.log('2. Your organization has enabled service account access');
    } else if (error.code === 'insufficient_quota') {
      console.log('\nQuota error. For service accounts, please check:');
      console.log('1. Your organization has available quota');
      console.log('2. The service account has been granted quota access');
      console.log('3. Your billing settings are properly configured');
    }
  }
}

testOpenAI(); 