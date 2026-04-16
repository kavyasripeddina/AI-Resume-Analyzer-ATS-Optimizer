const express = require('express');
const { body, validationResult } = require('express-validator');
const { protect } = require('../middleware/auth');
const AppError = require('../utils/AppError');
const {
  runAnalysis,
  getAnalysisHistory,
  getAnalysis,
  deleteAnalysis,
  getDashboard,
  autoTailor
} = require('../controllers/analysisController');

const router = express.Router();

// Validation helper
const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages = errors.array().map((e) => e.msg).join('. ');
    return next(new AppError(messages, 400));
  }
  next();
};

// Analysis validation
const analysisValidation = [
  body('resumeId')
    .notEmpty().withMessage('Resume ID is required')
    .isMongoId().withMessage('Invalid resume ID'),
  body('jobDescription')
    .trim()
    .notEmpty().withMessage('Job description is required')
    .isLength({ min: 50 }).withMessage('Job description must be at least 50 characters')
    .isLength({ max: 20000 }).withMessage('Job description is too long (max 20,000 characters)'),
  body('jobTitle')
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage('Job title too long'),
  body('jobCompany')
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage('Company name too long'),
];

// All routes require authentication
router.use(protect);

router.get('/dashboard', getDashboard);
router.post('/run', analysisValidation, handleValidation, runAnalysis);
router.get('/', getAnalysisHistory);
router.get('/:id', getAnalysis);
router.delete('/:id', deleteAnalysis);

router.post('/tailor-builder', autoTailor);

module.exports = router;
