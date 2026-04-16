const mongoose = require('mongoose');

const analysisResultSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    resume: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resume',
      required: true,
    },
    jobDescription: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'JobDescription',
      required: true,
    },
    // ATS Score (0–100)
    atsScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    scoreBreakdown: {
      keywordMatch: { type: Number, default: 0 },
      skillsMatch: { type: Number, default: 0 },
      experienceMatch: { type: Number, default: 0 },
      formatScore: { type: Number, default: 0 },
    },
    // Keyword Analysis
    matchedKeywords: [
      {
        keyword: String,
        frequency: Number,
        importance: { type: String, enum: ['high', 'medium', 'low'] },
      },
    ],
    missingKeywords: [
      {
        keyword: String,
        importance: { type: String, enum: ['high', 'medium', 'low'] },
        suggestion: String,
      },
    ],
    // AI Improvements
    improvedBulletPoints: [
      {
        original: String,
        improved: String,
        reason: String,
      },
    ],
    generalSuggestions: [String],
    aiSummary: {
      type: String,
      default: '',
    },
    // Metadata
    processingTime: {
      type: Number,
      default: 0, // milliseconds
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'completed',
    },
    errorMessage: {
      type: String,
      default: null,
    },
    // Cached snapshot for reports
    resumeSnapshot: {
      fileName: String,
      wordCount: Number,
    },
    jobSnapshot: {
      title: String,
      company: String,
    },
  },
  {
    timestamps: true,
  }
);

analysisResultSchema.index({ user: 1, createdAt: -1 });
analysisResultSchema.index({ resume: 1, jobDescription: 1 });

module.exports = mongoose.model('AnalysisResult', analysisResultSchema);
