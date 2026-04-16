const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    originalName: {
      type: String,
      required: true,
    },
    fileType: {
      type: String,
      enum: ['pdf', 'docx'],
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    filePath: {
      type: String,
      required: true,
    },
    extractedText: {
      type: String,
      default: '',
    },
    wordCount: {
      type: Number,
      default: 0,
    },
    isProcessed: {
      type: Boolean,
      default: false,
    },
    processingError: {
      type: String,
      default: null,
    },
    sections: {
      experience: { type: String, default: '' },
      education: { type: String, default: '' },
      skills: { type: String, default: '' },
      summary: { type: String, default: '' },
      projects: { type: String, default: '' },
    },
    version: {
      type: Number,
      default: 1,
    },
    tags: [String],
  },
  {
    timestamps: true,
  }
);

// Index for fast querying
resumeSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Resume', resumeSchema);
