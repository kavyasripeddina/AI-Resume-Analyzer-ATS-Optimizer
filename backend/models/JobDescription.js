const mongoose = require('mongoose');

const jobDescriptionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Job title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    company: {
      type: String,
      trim: true,
      maxlength: [200, 'Company name cannot exceed 200 characters'],
      default: '',
    },
    description: {
      type: String,
      required: [true, 'Job description is required'],
      minlength: [50, 'Job description must be at least 50 characters'],
    },
    truncatedDescription: {
      type: String,
      default: '',
    },
    extractedKeywords: [String],
    requiredSkills: [String],
    industry: {
      type: String,
      default: '',
    },
    experienceLevel: {
      type: String,
      enum: ['entry', 'mid', 'senior', 'lead', 'executive', ''],
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

jobDescriptionSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('JobDescription', jobDescriptionSchema);
