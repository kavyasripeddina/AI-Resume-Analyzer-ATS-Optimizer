const Resume = require('../models/Resume');
const JobDescription = require('../models/JobDescription');
const AnalysisResult = require('../models/AnalysisResult');
const AppError = require('../utils/AppError');
const { calculateATSScore, extractKeywords } = require('../utils/nlpEngine');
const { improveBulletPoints, generateATSTips } = require('../utils/aiService');

/**
 * POST /api/analysis/run
 * Core endpoint — runs full ATS analysis
 */
const runAnalysis = async (req, res, next) => {
  const startTime = Date.now();

  try {
    const { resumeId, jobTitle, jobCompany, jobDescription } = req.body;

    // ---- Validate inputs ----
    if (!resumeId) {
      return next(new AppError('Please select a resume to analyze.', 400));
    }

    const trimmedJD = (jobDescription || '').trim();
    if (!trimmedJD) {
      return next(new AppError('Please enter a job description.', 400));
    }

    if (trimmedJD.length < 50) {
      return next(new AppError('Job description is too short. Please provide at least 50 characters for accurate analysis.', 400));
    }

    // Truncate extremely long JD (keep first 8000 chars for NLP performance)
    const processedJD = trimmedJD.length > 8000 ? trimmedJD.substring(0, 8000) : trimmedJD;

    // ---- Fetch resume ----
    const resume = await Resume.findOne({ _id: resumeId, user: req.user.id });
    if (!resume) {
      return next(new AppError('Resume not found. Please upload a resume first.', 404));
    }

    if (!resume.isProcessed || !resume.extractedText) {
      return next(new AppError('Resume has not been processed yet. Please re-upload your resume.', 422));
    }

    // ---- Save job description ----
    const jdKeywords = extractKeywords(processedJD, 40).map((k) => k.keyword);

    const jobDesc = await JobDescription.create({
      user: req.user.id,
      title: (jobTitle || '').trim() || 'Untitled Position',
      company: (jobCompany || '').trim() || '',
      description: processedJD,
      truncatedDescription: trimmedJD.length > 8000 ? processedJD : '',
      extractedKeywords: jdKeywords,
    });

    // ---- Calculate ATS Score ----
    const atsResult = calculateATSScore(resume.extractedText, processedJD);

    // ---- AI Improvements ----
    let aiResult;
    try {
      aiResult = await improveBulletPoints(resume.extractedText, processedJD);
    } catch (aiError) {
      console.error('AI improvement error (non-fatal):', aiError.message);
      aiResult = {
        improvedBullets: [],
        generalSuggestions: ['AI analysis temporarily unavailable. Please try again later.'],
        aiSummary: '',
        usedFallback: true,
      };
    }

    // ---- Generate ATS Tips ----
    let atsTips = [];
    try {
      atsTips = await generateATSTips(atsResult.score, atsResult.missingKeywords, resume.extractedText);
    } catch (tipsError) {
      console.error('ATS tips error (non-fatal):', tipsError.message);
    }

    const processingTime = Date.now() - startTime;

    // ---- Save Analysis Result ----
    const analysisResult = await AnalysisResult.create({
      user: req.user.id,
      resume: resume._id,
      jobDescription: jobDesc._id,
      atsScore: atsResult.score,
      scoreBreakdown: atsResult.breakdown,
      matchedKeywords: atsResult.matchedKeywords,
      missingKeywords: atsResult.missingKeywords,
      improvedBulletPoints: aiResult.improvedBullets.map((b) => ({
        original: b.original || '',
        improved: b.improved || '',
        reason: b.reason || '',
      })),
      generalSuggestions: [
        ...(aiResult.generalSuggestions || []),
        ...(atsTips || []),
      ].slice(0, 10), // Limit to 10 suggestions
      aiSummary: aiResult.aiSummary || '',
      processingTime,
      status: 'completed',
      resumeSnapshot: {
        fileName: resume.originalName,
        wordCount: resume.wordCount,
      },
      jobSnapshot: {
        title: jobDesc.title,
        company: jobDesc.company,
      },
    });

    // Update user analysis count
    await require('../models/User').findByIdAndUpdate(req.user.id, {
      $inc: { analysisCount: 1 },
    });

    res.status(201).json({
      success: true,
      message: 'Analysis completed successfully.',
      data: {
        analysisId: analysisResult._id,
        atsScore: atsResult.score,
        similarity: atsResult.similarity,
        scoreBreakdown: atsResult.breakdown,
        stats: atsResult.stats,
        matchedKeywords: atsResult.matchedKeywords,
        missingKeywords: atsResult.missingKeywords,
        improvedBulletPoints: aiResult.improvedBullets,
        generalSuggestions: analysisResult.generalSuggestions,
        aiSummary: aiResult.aiSummary,
        usedAIFallback: aiResult.usedFallback,
        processingTime,
        resume: {
          _id: resume._id,
          originalName: resume.originalName,
          wordCount: resume.wordCount,
        },
        job: {
          _id: jobDesc._id,
          title: jobDesc.title,
          company: jobDesc.company,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/analysis
 * Get analysis history with pagination
 */
const getAnalysisHistory = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [analyses, total] = await Promise.all([
      AnalysisResult.find({ user: req.user.id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('-improvedBulletPoints -matchedKeywords -missingKeywords -generalSuggestions')
        .populate('resume', 'originalName wordCount')
        .populate('jobDescription', 'title company'),
      AnalysisResult.countDocuments({ user: req.user.id }),
    ]);

    // Dashboard stats
    const stats = await AnalysisResult.aggregate([
      { $match: { user: req.user._id, status: 'completed' } },
      {
        $group: {
          _id: null,
          avgScore: { $avg: '$atsScore' },
          maxScore: { $max: '$atsScore' },
          minScore: { $min: '$atsScore' },
          totalAnalyses: { $sum: 1 },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        analyses,
        stats: stats[0] || { avgScore: 0, maxScore: 0, minScore: 0, totalAnalyses: 0 },
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
 * GET /api/analysis/:id
 * Get a specific analysis result
 */
const getAnalysis = async (req, res, next) => {
  try {
    const analysis = await AnalysisResult.findOne({
      _id: req.params.id,
      user: req.user.id,
    })
      .populate('resume', 'originalName wordCount fileType')
      .populate('jobDescription', 'title company description extractedKeywords');

    if (!analysis) {
      return next(new AppError('Analysis result not found or you do not have permission to access it.', 404));
    }

    res.status(200).json({
      success: true,
      data: { analysis },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/analysis/:id
 */
const deleteAnalysis = async (req, res, next) => {
  try {
    const analysis = await AnalysisResult.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!analysis) {
      return next(new AppError('Analysis not found or you do not have permission to delete it.', 404));
    }

    await AnalysisResult.deleteOne({ _id: analysis._id });

    res.status(200).json({
      success: true,
      message: 'Analysis deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/analysis/dashboard
 * Get dashboard aggregated data
 */
const getDashboard = async (req, res, next) => {
  try {
    const [recentAnalyses, scoreHistory, topStats] = await Promise.all([
      // Recent 5 analyses
      AnalysisResult.find({ user: req.user.id, status: 'completed' })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('atsScore scoreBreakdown resumeSnapshot jobSnapshot createdAt')
        .lean(),

      // Score history for chart (last 30 days)
      AnalysisResult.find({
        user: req.user.id,
        status: 'completed',
        createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      })
        .sort({ createdAt: 1 })
        .select('atsScore createdAt jobSnapshot')
        .lean(),

      // Aggregate stats
      AnalysisResult.aggregate([
        { $match: { user: req.user._id, status: 'completed' } },
        {
          $group: {
            _id: null,
            avgScore: { $avg: '$atsScore' },
            maxScore: { $max: '$atsScore' },
            totalAnalyses: { $sum: 1 },
            avgProcessingTime: { $avg: '$processingTime' },
          },
        },
      ]),
    ]);

    res.status(200).json({
      success: true,
      data: {
        recentAnalyses,
        scoreHistory,
        stats: topStats[0] || {
          avgScore: 0,
          maxScore: 0,
          totalAnalyses: 0,
          avgProcessingTime: 0,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Auto tailor resume builder data using AI
 * @route   POST /api/analysis/tailor-builder
 * @access  Private
 */
const autoTailor = async (req, res, next) => {
  try {
    const { baseData, roleTitle } = req.body;
    if (!baseData || !roleTitle) {
      return next(new AppError('Base resume data and target role are required', 400));
    }

    const { tailorBuilderData } = require('../utils/aiService');
    const tailoredData = await tailorBuilderData(baseData, roleTitle);

    res.status(200).json({
      success: true,
      tailoredData
    });
  } catch (error) {
    next(new AppError(error.message, 500));
  }
};

module.exports = { runAnalysis, getAnalysisHistory, getAnalysis, deleteAnalysis, getDashboard, autoTailor };
