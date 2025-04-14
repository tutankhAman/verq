const fs = require('fs');
const path = require('path');
const { processPDF } = require('../services/pdfService');
const { generateInterviewQuestion } = require('../services/geminiService');
const { textToSpeech } = require('../services/textToSpeechService');
const { validateConfig } = require('../config/config');

// Validate environment variables
validateConfig();

// Get the PDF file path and role from command line arguments
const pdfPath = process.argv[2];
const role = process.argv[3];

if (!pdfPath) {
  console.error('Please provide a PDF file path as an argument');
  console.error('Usage: node extract-pdf.js <path-to-pdf> <role>');
  process.exit(1);
}

if (!role) {
  console.error('Please provide a role as an argument');
  console.error('Usage: node extract-pdf.js <path-to-pdf> <role>');
  process.exit(1);
}

if (!fs.existsSync(pdfPath)) {
  console.error(`File not found: ${pdfPath}`);
  process.exit(1);
}

// Create output directory if it doesn't exist
const outputDir = path.join(__dirname, '..', 'output');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

// Function to generate a fallback question based on the resume text
function generateFallbackQuestion(resumeText) {
  // Extract skills and projects from the resume text
  const skillsMatch = resumeText.match(/SKILLS.*?(?=EXPERIENCE|PROJECTS|ACTIVITIES|$)/is);
  const projectsMatch = resumeText.match(/PROJECTS.*?(?=ACTIVITIES|$)/is);
  
  let skills = [];
  let projects = [];
  
  if (skillsMatch) {
    const skillsText = skillsMatch[0];
    // Extract programming languages
    const languagesMatch = skillsText.match(/Programming Languages:\s*([^\n]+)/i);
    if (languagesMatch) {
      skills = skills.concat(languagesMatch[1].split(',').map(s => s.trim()));
    }
    
    // Extract frontend technologies
    const frontendMatch = skillsText.match(/Frontend Technologies:\s*([^\n]+)/i);
    if (frontendMatch) {
      skills = skills.concat(frontendMatch[1].split(',').map(s => s.trim()));
    }
    
    // Extract backend technologies
    const backendMatch = skillsText.match(/Backend Technologies:\s*([^\n]+)/i);
    if (backendMatch) {
      skills = skills.concat(backendMatch[1].split(',').map(s => s.trim()));
    }
  }
  
  if (projectsMatch) {
    const projectsText = projectsMatch[0];
    // Extract project names
    const projectNames = projectsText.match(/\[Link.*?\]/g) || [];
    projects = projectNames.map(name => name.replace(/\[Link.*?\]/g, '').trim());
  }
  
  // Generate a question based on the extracted information
  let question = "Can you explain how you would implement ";
  
  if (projects.length > 0) {
    const randomProject = projects[Math.floor(Math.random() * projects.length)];
    question += `a feature in your ${randomProject} project using `;
  } else {
    question += "a feature in your most recent project using ";
  }
  
  if (skills.length > 0) {
    const randomSkill = skills[Math.floor(Math.random() * skills.length)];
    question += `${randomSkill}?`;
  } else {
    question += "your preferred technology stack?";
  }
  
  return question;
}

async function extractAndProcessPDF() {
  try {
    console.log(`Processing PDF: ${pdfPath}`);
    
    // Read the PDF file
    const pdfBuffer = fs.readFileSync(pdfPath);
    
    // Extract text from the PDF
    const extractedText = await processPDF(pdfBuffer);
    
    // Generate output filename using timestamp and original filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const originalFileName = path.basename(pdfPath, '.pdf');
    const textOutputPath = path.join(outputDir, `${originalFileName}_${timestamp}.txt`);
    
    // Save the extracted text
    fs.writeFileSync(textOutputPath, extractedText);
    
    console.log('\nExtracted Text:');
    console.log('----------------------------------------');
    console.log(extractedText);
    console.log('----------------------------------------');
    console.log(`\nText has been saved to: ${textOutputPath}`);

    // Generate interview question using Gemini
    console.log('\nGenerating interview question...');
    try {
      const question = await generateInterviewQuestion(extractedText, role);
      
      console.log('\nGenerated Interview Question:');
      console.log('----------------------------------------');
      console.log(question);
      console.log('----------------------------------------');

      // Convert question to speech using ElevenLabs
      console.log('\nConverting question to speech...');
      const audioOutputPath = path.join(outputDir, `${originalFileName}_${timestamp}.mp3`);
      await textToSpeech(question, audioOutputPath, 'en-us');
      
      console.log(`\nAudio has been saved to: ${audioOutputPath}`);
    } catch (geminiError) {
      console.error('\nError with Gemini API:', geminiError.message);
      console.log('\nGenerating fallback question instead...');
      
      const fallbackQuestion = generateFallbackQuestion(extractedText);
      
      console.log('\nFallback Interview Question:');
      console.log('----------------------------------------');
      console.log(fallbackQuestion);
      console.log('----------------------------------------');
      
      // Convert fallback question to speech
      console.log('\nConverting fallback question to speech...');
      const audioOutputPath = path.join(outputDir, `${originalFileName}_${timestamp}_fallback.mp3`);
      await textToSpeech(fallbackQuestion, audioOutputPath);
      
      console.log(`\nAudio has been saved to: ${audioOutputPath}`);
      console.log('\nNote: This is a fallback question generated without using AI. For better questions, please fix the Gemini API issue.');
    }
    
  } catch (error) {
    console.error('Error processing PDF:', error.message);
    process.exit(1);
  }
}

extractAndProcessPDF(); 