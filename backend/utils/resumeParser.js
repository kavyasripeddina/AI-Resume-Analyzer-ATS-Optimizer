const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const fs = require('fs');
const path = require('path');
const AppError = require('./AppError');

/**
 * Extract text from a PDF file
 */
const extractFromPDF = async (filePath) => {
  try {
    const fileBuffer = fs.readFileSync(filePath);

    if (fileBuffer.length === 0) {
      throw new AppError('The uploaded PDF file is empty.', 400);
    }

    const data = await pdfParse(fileBuffer, {
      max: 0, // parse all pages
    });

    const text = data.text || '';

    if (!text || text.trim().length < 20) {
      throw new AppError(
        'Could not extract meaningful text from this PDF. The file may be image-based or corrupted. Please upload a text-based PDF.',
        422
      );
    }

    return {
      text: text.trim(),
      pageCount: data.numpages || 1,
      wordCount: text.split(/\s+/).filter(Boolean).length,
    };
  } catch (err) {
    if (err.isOperational) throw err;

    // Handle corrupted PDF
    if (err.message && (err.message.includes('Invalid PDF') || err.message.includes('Error'))) {
      throw new AppError('The PDF file appears to be corrupted or invalid. Please upload a valid PDF resume.', 422);
    }

    throw new AppError(`Failed to parse PDF: ${err.message}`, 500);
  }
};

/**
 * Extract text from a DOCX file
 */
const extractFromDOCX = async (filePath) => {
  try {
    const fileBuffer = fs.readFileSync(filePath);

    if (fileBuffer.length === 0) {
      throw new AppError('The uploaded DOCX file is empty.', 400);
    }

    const result = await mammoth.extractRawText({ buffer: fileBuffer });
    const text = result.value || '';

    if (!text || text.trim().length < 20) {
      throw new AppError(
        'Could not extract meaningful text from this DOCX file. The document may be empty or formatted unusually.',
        422
      );
    }

    // Report any warnings
    if (result.messages && result.messages.length > 0) {
      console.warn('DOCX parsing warnings:', result.messages);
    }

    return {
      text: text.trim(),
      pageCount: 1,
      wordCount: text.split(/\s+/).filter(Boolean).length,
      warnings: result.messages || [],
    };
  } catch (err) {
    if (err.isOperational) throw err;
    throw new AppError(`Failed to parse DOCX file: ${err.message}`, 500);
  }
};

/**
 * Extract resume sections using heuristics
 */
const extractSections = (text) => {
  if (!text || typeof text !== 'string') return {};

  const sections = {
    summary: '',
    experience: '',
    education: '',
    skills: '',
    projects: '',
  };

  const sectionPatterns = {
    summary: /(?:summary|objective|profile|about me)[:\s]*([\s\S]*?)(?=\n(?:experience|work|employment|education|skills|projects|certifications|$))/i,
    experience: /(?:experience|work history|employment|work experience)[:\s]*([\s\S]*?)(?=\n(?:education|skills|projects|certifications|interests|$))/i,
    education: /(?:education|academic|qualifications?)[:\s]*([\s\S]*?)(?=\n(?:skills|projects|certifications|interests|experience|$))/i,
    skills: /(?:skills|technical skills|core competencies|technologies)[:\s]*([\s\S]*?)(?=\n(?:projects|certifications|interests|experience|education|$))/i,
    projects: /(?:projects|personal projects|portfolio)[:\s]*([\s\S]*?)(?=\n(?:certifications|interests|education|skills|$))/i,
  };

  for (const [key, pattern] of Object.entries(sectionPatterns)) {
    const match = text.match(pattern);
    if (match && match[1]) {
      sections[key] = match[1].trim().substring(0, 3000); // Limit section length
    }
  }

  return sections;
};

/**
 * Main function to parse resume based on file type
 */
const parseResume = async (filePath, fileType) => {
  const ext = fileType || path.extname(filePath).toLowerCase().replace('.', '');

  let result;

  if (ext === 'pdf') {
    result = await extractFromPDF(filePath);
  } else if (ext === 'docx' || ext === 'doc') {
    result = await extractFromDOCX(filePath);
  } else {
    throw new AppError(`Unsupported file type: ${ext}. Please upload a PDF or DOCX file.`, 400);
  }

  const sections = extractSections(result.text);

  return {
    ...result,
    sections,
  };
};

/**
 * Clean up uploaded file
 */
const deleteFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (err) {
    console.error('Failed to delete file:', err.message);
  }
};

module.exports = { parseResume, extractSections, deleteFile };
