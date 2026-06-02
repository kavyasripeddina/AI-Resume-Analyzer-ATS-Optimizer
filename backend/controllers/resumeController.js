const path = require('path');
const Resume = require('../models/Resume');
const AppError = require('../utils/AppError');
const { parseResume } = require('../utils/resumeParser');

/**
 * POST /api/resumes/upload
 */
const uploadResume = async (req, res, next) => {

  try {
    const file = req.file;
    const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
    const fileType = ext === 'doc' ? 'docx' : ext;

    // Validate file type one more time
    if (!['pdf', 'docx'].includes(fileType)) {
      return next(new AppError('Unsupported file format. Only PDF and DOCX files are allowed.', 400));
    }

    // Parse the resume
    let parsedData;
    try {
      // Pass the fully loaded memory buffer instead of the file path
      parsedData = await parseResume(file, fileType);
    } catch (parseError) {
      return next(parseError);
    }

    // Check if extracted text is meaningful
    if (!parsedData.text || parsedData.text.trim().length < 20) {
      return next(new AppError(
        'Could not extract text from this file. Please ensure your resume contains text (not just images).',
        422
      ));
    }

    // Check for duplicate processing (same file name + size within last hour)
    const recentDuplicate = await Resume.findOne({
      user: req.user.id,
      originalName: file.originalname,
      fileSize: file.size,
      createdAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) },
    });

    if (recentDuplicate) {
      return res.status(200).json({
        success: true,
        message: 'This resume was already uploaded recently.',
        data: { resume: recentDuplicate },
      });
    }

    // Save to database
    const resume = await Resume.create({
      user: req.user.id,
      fileName: file.originalname,
      originalName: file.originalname,
      fileType,
      fileSize: file.size,
      filePath: 'memory-storage', // No path anymore
      extractedText: parsedData.text,
      wordCount: parsedData.wordCount,
      sections: parsedData.sections,
      isProcessed: true,
    });

    // Update user analysis count
    await require('../models/User').findByIdAndUpdate(req.user.id, {
      $inc: { analysisCount: 0 }, // Don't increment until analysis is run
    });

    res.status(201).json({
      success: true,
      message: 'Resume uploaded and parsed successfully.',
      data: {
        resume: {
          _id: resume._id,
          originalName: resume.originalName,
          fileType: resume.fileType,
          fileSize: resume.fileSize,
          wordCount: resume.wordCount,
          sections: resume.sections,
          isProcessed: resume.isProcessed,
          createdAt: resume.createdAt,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/resumes
 */
const getResumes = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [resumes, total] = await Promise.all([
      Resume.find({ user: req.user.id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('-extractedText -filePath'),
      Resume.countDocuments({ user: req.user.id }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        resumes,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/resumes/:id
 */
const getResume = async (req, res, next) => {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, user: req.user.id });

    if (!resume) {
      return next(new AppError('Resume not found or you do not have permission to access it.', 404));
    }

    res.status(200).json({
      success: true,
      data: { resume },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/resumes/:id
 */
const deleteResume = async (req, res, next) => {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, user: req.user.id });

    if (!resume) {
      return next(new AppError('Resume not found or you do not have permission to delete it.', 404));
    }

    // No physical file to delete anymore, handled automatically
    // Delete from DB
    await Resume.deleteOne({ _id: resume._id });

    // Also delete related analysis results
    await require('../models/AnalysisResult').deleteMany({ resume: resume._id });

    res.status(200).json({
      success: true,
      message: 'Resume deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { uploadResume, getResumes, getResume, deleteResume };
