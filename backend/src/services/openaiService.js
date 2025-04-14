const OpenAI = require('openai');
const { config } = require('../config/config');

/**
 * Generate an interview question based on the resume text
 * @param {string} resumeText - Extracted text from the resume
 * @returns {Promise<string>} - Generated interview question
 */
async function generateInterviewQuestion(resumeText) {
  const openai = new OpenAI({
    apiKey: config.openai.apiKey,
  });

  const prompt = `Based on the following resume text, generate a single technical interview question. 
  The question should be moderate to high difficulty and should focus on:
  1. The projects mentioned in the resume
  2. The technical skills listed
  3. The technologies used in their projects
  
  The question should test their deep understanding of the technologies and concepts they claim to know.
  Make the question specific and detailed, requiring them to demonstrate practical knowledge.
  
  Resume Text:
  ${resumeText}
  
  Generate only the question, without any additional explanation or context.`;

  try {
    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-3.5-turbo",
      temperature: 0.7,
      max_tokens: 150
    });

    return completion.choices[0].message.content.trim();
  } catch (error) {
    console.error('Error generating interview question:', error);
    
    // Handle specific OpenAI API errors
    if (error.code === 'insufficient_quota') {
      throw new Error(
        'OpenAI API quota exceeded. Please check your OpenAI account billing details or use a different API key. ' +
        'Visit https://platform.openai.com/account/billing to add payment information.'
      );
    } else if (error.code === 'invalid_api_key') {
      throw new Error(
        'Invalid OpenAI API key. Please check your .env file and ensure OPENAI_API_KEY is set correctly.'
      );
    } else if (error.code === 'rate_limit_exceeded') {
      throw new Error(
        'OpenAI API rate limit exceeded. Please try again in a few minutes.'
      );
    } else {
      throw new Error(`Failed to generate interview question: ${error.message}`);
    }
  }
}

module.exports = {
  generateInterviewQuestion
}; 