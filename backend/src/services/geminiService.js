const { GoogleGenerativeAI } = require('@google/generative-ai');
const { config } = require('../config/config');

/**
 * Generate a brief interview question based on the resume text and role using Google's Gemini AI
 * @param {string} resumeText - Extracted text from the resume
 * @param {string} role - The role the candidate is applying for
 * @returns {Promise<string>} - Generated interview question
 */
async function generateInterviewQuestion(resumeText, role) {
  const genAI = new GoogleGenerativeAI(config.gemini.apiKey);

  const prompt = `Based on the following resume text and the role the candidate is applying for, generate a single technical interview question and should be brief with around 2-3 lines. 
  The question should be moderate to high difficulty and should focus on:
  1. The projects mentioned in the resume
  2. The technical skills listed
  3. The technologies used in their projects
  4. The specific requirements and responsibilities of the role they're applying for
  
  The question should test their deep understanding of the technologies and concepts they claim to know, 
  while also assessing their fit for the specific role.
  Make the question specific and detailed, requiring them to demonstrate practical knowledge.
  
  Role: ${role}
  Resume Text:
  ${resumeText}
  
  Generate only the question, without any additional explanation or context.`;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    console.error('Error generating interview question with Gemini:', error);
    
    if (error.message.includes('API key')) {
      throw new Error(
        'Invalid Gemini API key. Please check your .env file and ensure GEMINI_API_KEY is set correctly.'
      );
    } else if (error.message.includes('quota')) {
      throw new Error(
        'Gemini API quota exceeded. Please check your Google Cloud Console for quota limits.'
      );
    } else {
      throw new Error(`Failed to generate interview question: ${error.message}`);
    }
  }
}

/**
 * Evaluate an interview answer using Google's Gemini AI
 * @param {string} question - The interview question
 * @param {string} answer - The candidate's answer transcript
 * @returns {Promise<Object>} - Evaluation results with scores and feedback
 */
async function evaluateAnswer(question, answer) {
  const genAI = new GoogleGenerativeAI(config.gemini.apiKey);

  console.log('Gemini Evaluation - Input:');
  console.log('Question:', question);
  console.log('Answer:', answer);

  const prompt = `As an expert technical interviewer, evaluate the following interview answer. 
Provide your evaluation in EXACTLY this format (including the dashes and spacing):

Clarity Score (1-10): [X]
- Brief explanation: [Your explanation]

Technical Accuracy Score (1-10): [X]
- Brief explanation: [Your explanation]

Language & Communication Score (1-10): [X]
- Brief explanation: [Your explanation]

Key Strengths:
- [Point 1]
- [Point 2]
- [Point 3]

Areas to Improve:
- [Point 1]
- [Point 2]
- [Point 3]

Recommendations:
- [Point 1]
- [Point 2]
- [Point 3]

Overall Score (1-10): [X]

Question being evaluated: "${question}"

Candidate's answer: "${answer}"

Remember to:
1. Use numbers 1-10 for all scores
2. Keep explanations concise (1-2 sentences)
3. Provide exactly 3 bullet points for each list
4. Follow the exact format above`;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const evaluationText = response.text().trim();
    
    console.log('Gemini Evaluation - Raw Response:');
    console.log(evaluationText);

    // Extract scores and explanations with more precise patterns
    const clarityMatch = evaluationText.match(/Clarity Score \(1-10\):\s*(\d+)\s*\n-\s*Brief explanation:\s*([^\n]+)/);
    const technicalMatch = evaluationText.match(/Technical Accuracy Score \(1-10\):\s*(\d+)\s*\n-\s*Brief explanation:\s*([^\n]+)/);
    const languageMatch = evaluationText.match(/Language & Communication Score \(1-10\):\s*(\d+)\s*\n-\s*Brief explanation:\s*([^\n]+)/);
    const overallMatch = evaluationText.match(/Overall Score \(1-10\):\s*(\d+)/);

    // Extract bullet points with more precise patterns
    const extractBulletPoints = (text, section) => {
      const pattern = new RegExp(`${section}:\\s*\\n(?:-\\s*[^\\n]+\\s*\\n?)+`, 'i');
      const match = text.match(pattern);
      if (!match) return [];
      
      return match[0]
        .split('\n')
        .filter(line => line.trim().startsWith('-'))
        .map(line => line.replace(/^-\s*/, '').trim())
        .filter(line => line.length > 0);
    };

    const evaluation = {
      clarity: {
        score: clarityMatch ? parseInt(clarityMatch[1]) : 0,
        explanation: clarityMatch ? clarityMatch[2].trim() : 'No feedback available'
      },
      technicalAccuracy: {
        score: technicalMatch ? parseInt(technicalMatch[1]) : 0,
        explanation: technicalMatch ? technicalMatch[2].trim() : 'No feedback available'
      },
      language: {
        score: languageMatch ? parseInt(languageMatch[1]) : 0,
        explanation: languageMatch ? languageMatch[2].trim() : 'No feedback available'
      },
      strengths: extractBulletPoints(evaluationText, 'Key Strengths'),
      areasForImprovement: extractBulletPoints(evaluationText, 'Areas to Improve'),
      recommendations: extractBulletPoints(evaluationText, 'Recommendations'),
      overallScore: overallMatch ? parseInt(overallMatch[1]) : 0
    };

    // Validate the evaluation object
    if (evaluation.overallScore === 0 || 
        evaluation.clarity.score === 0 || 
        evaluation.technicalAccuracy.score === 0 || 
        evaluation.language.score === 0) {
      console.error('Invalid evaluation scores detected:', evaluation);
      console.error('Raw evaluation text:', evaluationText);
    }

    console.log('Gemini Evaluation - Processed Result:');
    console.log(JSON.stringify(evaluation, null, 2));

    return evaluation;
  } catch (error) {
    console.error('Error evaluating answer with Gemini:', error);
    throw new Error(`Failed to evaluate answer: ${error.message}`);
  }
}

/**
 * Generate a follow-up question based on the previous answer and evaluation
 * @param {string} resumeText - Extracted text from the resume
 * @param {string} previousQuestion - The previous question asked
 * @param {string} answer - The candidate's answer
 * @param {Object} evaluation - The evaluation of the previous answer
 * @returns {Promise<string>} - Generated follow-up question
 */
async function generateFollowUpQuestion(resumeText, previousQuestion, answer, evaluation) {
  const genAI = new GoogleGenerativeAI(config.gemini.apiKey);

  const prompt = `Based on the following information, generate a follow-up question:

Previous Question: ${previousQuestion}
Candidate's Answer: ${answer}
Evaluation: ${JSON.stringify(evaluation)}

If the answer was irrelevant or scored low on technical accuracy, generate a new question based on the resume that tests their knowledge in a different area.
If the answer was good, generate a deeper follow-up question that builds on their response and tests their understanding further.

Resume Text:
${resumeText}

Generate only the question, without any additional explanation or context.`;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    console.error('Error generating follow-up question with Gemini:', error);
    throw new Error(`Failed to generate follow-up question: ${error.message}`);
  }
}

/**
 * Generate an overall evaluation for the entire interview
 * @param {Array} questions - Array of questions with answers and evaluations
 * @param {string} role - The job role
 * @returns {Promise<Object>} - Overall evaluation results
 */
async function generateOverallEvaluation(questions, role) {
  const genAI = new GoogleGenerativeAI(config.gemini.apiKey);

  const prompt = `You are an expert technical interviewer evaluating a candidate for a ${role} position.
The candidate has completed ${questions.length} questions. Here are their responses:

${questions.map((qa, index) => `
Q${index + 1}: ${qa.question}
A${index + 1}: ${qa.answer}
E${index + 1}: ${JSON.stringify(qa.evaluation)}
`).join('\n')}

IMPORTANT: You must follow this EXACT template. Replace the [text] with your evaluation, keeping all formatting, spacing, and dashes exactly as shown:

Overall Technical Proficiency (1-10): [single number 1-10]
- Brief explanation: [single sentence explanation]

Communication Skills (1-10): [single number 1-10]
- Brief explanation: [single sentence explanation]

Problem-Solving Ability (1-10): [single number 1-10]
- Brief explanation: [single sentence explanation]

Key Strengths:
- [first strength point]
- [second strength point]
- [third strength point]

Areas for Growth:
- [first growth area]
- [second growth area]
- [third growth area]

Final Recommendations:
- [first recommendation]
- [second recommendation]
- [third recommendation]

Hiring Recommendation: [EXACTLY one of: STRONG HIRE, HIRE, CONSIDER, DO NOT HIRE]
- Justification: [2-3 sentence justification]

Overall Interview Score (1-10): [single number 1-10]

CRITICAL RULES:
1. All scores must be single whole numbers between 1 and 10
2. Each bullet point section must have EXACTLY 3 points
3. Hiring recommendation must be EXACTLY one of: STRONG HIRE, HIRE, CONSIDER, DO NOT HIRE
4. Keep all dashes, colons, and spacing exactly as shown
5. Do not add any text outside this template`;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const evaluationText = response.text().trim();
    
    console.log('Overall Evaluation - Raw Response:', evaluationText);

    // Extract sections with more flexible patterns
    const extractSection = (text, sectionName) => {
      const sectionPattern = new RegExp(`${sectionName}[^:]*:\\s*(\\d+)[^\\n]*\\n-\\s*Brief explanation:\\s*([^\\n]+)`, 'i');
      const match = text.match(sectionPattern);
      if (!match) {
        console.error(`Failed to extract section: ${sectionName}`);
        return null;
      }
      const score = parseInt(match[1]);
      if (isNaN(score) || score < 1 || score > 10) {
        console.error(`Invalid score in section ${sectionName}: ${match[1]}`);
        return null;
      }
      return {
        score,
        explanation: match[2].trim()
      };
    };

    // Extract bullet points with more flexible pattern
    const extractBulletPoints = (text, section) => {
      const sectionText = text.split(section + ':')[1]?.split(/\n\n|\n[A-Z]/)[0] || '';
      const points = sectionText
        .split('\n')
        .filter(line => line.trim().startsWith('-'))
        .map(line => line.replace(/^-\s*/, '').trim())
        .filter(line => line.length > 0);
      
      if (points.length !== 3) {
        console.error(`Invalid number of points in ${section}: ${points.length}`);
        return [];
      }
      return points;
    };

    // Extract hiring recommendation with more flexible pattern
    const extractHiringRecommendation = (text) => {
      const recommendationPattern = /Hiring Recommendation:\s*((?:STRONG HIRE|HIRE|CONSIDER|DO NOT HIRE))[^\n]*\n-\s*Justification:\s*([^\n]+)/i;
      const match = text.match(recommendationPattern);
      if (!match) {
        console.error('Failed to extract hiring recommendation');
        return null;
      }
      const decision = match[1].trim();
      if (!['STRONG HIRE', 'HIRE', 'CONSIDER', 'DO NOT HIRE'].includes(decision)) {
        console.error(`Invalid hiring decision: ${decision}`);
        return null;
      }
      return {
        decision,
        justification: match[2].trim()
      };
    };

    // Extract overall score
    const overallScoreMatch = evaluationText.match(/Overall Interview Score[^:]*:\s*(\d+)/i);
    const overallScore = overallScoreMatch ? parseInt(overallScoreMatch[1]) : 0;
    if (!overallScore || overallScore < 1 || overallScore > 10) {
      console.error(`Invalid overall score: ${overallScore}`);
    }

    // Build evaluation object
    const evaluation = {
      technicalProficiency: extractSection(evaluationText, 'Overall Technical Proficiency') || {
        score: 0,
        explanation: 'No feedback available'
      },
      communicationSkills: extractSection(evaluationText, 'Communication Skills') || {
        score: 0,
        explanation: 'No feedback available'
      },
      problemSolvingAbility: extractSection(evaluationText, 'Problem-Solving Ability') || {
        score: 0,
        explanation: 'No feedback available'
      },
      strengths: extractBulletPoints(evaluationText, 'Key Strengths'),
      areasForGrowth: extractBulletPoints(evaluationText, 'Areas for Growth'),
      recommendations: extractBulletPoints(evaluationText, 'Final Recommendations'),
      hiringRecommendation: extractHiringRecommendation(evaluationText) || {
        decision: 'NO DECISION',
        justification: 'No justification available'
      },
      overallScore: overallScore || 0
    };

    // Detailed validation with specific error messages
    const validationErrors = [];
    
    if (evaluation.technicalProficiency.score < 1) validationErrors.push('Invalid technical proficiency score');
    if (evaluation.communicationSkills.score < 1) validationErrors.push('Invalid communication skills score');
    if (evaluation.problemSolvingAbility.score < 1) validationErrors.push('Invalid problem-solving score');
    if (evaluation.overallScore < 1) validationErrors.push('Invalid overall score');
    
    if (evaluation.strengths.length !== 3) validationErrors.push(`Expected 3 strengths, got ${evaluation.strengths.length}`);
    if (evaluation.areasForGrowth.length !== 3) validationErrors.push(`Expected 3 areas for growth, got ${evaluation.areasForGrowth.length}`);
    if (evaluation.recommendations.length !== 3) validationErrors.push(`Expected 3 recommendations, got ${evaluation.recommendations.length}`);
    
    if (!['STRONG HIRE', 'HIRE', 'CONSIDER', 'DO NOT HIRE'].includes(evaluation.hiringRecommendation.decision)) {
      validationErrors.push(`Invalid hiring recommendation: ${evaluation.hiringRecommendation.decision}`);
    }

    if (validationErrors.length > 0) {
      console.error('Validation errors:', validationErrors);
      console.error('Raw evaluation text:', evaluationText);
      console.error('Processed evaluation:', JSON.stringify(evaluation, null, 2));
      throw new Error(`Generated evaluation did not meet the required format: ${validationErrors.join('; ')}`);
    }

    console.log('Overall Evaluation - Processed Result:', JSON.stringify(evaluation, null, 2));
    return evaluation;
  } catch (error) {
    console.error('Error in generateOverallEvaluation:', error);
    throw new Error(`Failed to generate overall evaluation: ${error.message}`);
  }
}

module.exports = {
  generateInterviewQuestion,
  evaluateAnswer,
  generateFollowUpQuestion,
  generateOverallEvaluation
}; 