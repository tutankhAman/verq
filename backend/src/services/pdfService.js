const pdfParse = require('pdf-parse');

/**
 * Process a PDF buffer and extract its text content
 * @param {Buffer} pdfBuffer - PDF file buffer
 * @returns {Promise<string>} - Extracted text from the PDF
 */
async function processPDF(pdfBuffer) {
  try {
    const data = await pdfParse(pdfBuffer);
    return data.text;
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw new Error('Failed to extract text from PDF');
  }
}

module.exports = {
  processPDF
}; 