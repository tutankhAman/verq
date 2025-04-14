const fs = require('fs');
const pdfParse = require('pdf-parse');

async function extractTextFromPDF(pdfPath) {
    try {
        const dataBuffer = fs.readFileSync(pdfPath);
        const data = await pdfParse(dataBuffer);
        console.log('Number of pages:', data.numpages);
        console.log('Text content:');
        console.log(data.text);
        return data.text;
    } catch (error) {
        console.error('Error extracting text from PDF:', error);
        throw error;
    }
}

// Get the PDF path from command line arguments
const pdfPath = process.argv[2];

if (!pdfPath) {
    console.error('Please provide a PDF file path as an argument');
    process.exit(1);
}

extractTextFromPDF(pdfPath)
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    }); 