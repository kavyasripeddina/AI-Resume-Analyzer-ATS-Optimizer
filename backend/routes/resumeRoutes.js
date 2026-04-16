const express = require('express');
const { protect } = require('../middleware/auth');
const { uploadResume } = require('../middleware/upload');
const {
  uploadResume: uploadResumeController,
  getResumes,
  getResume,
  deleteResume,
} = require('../controllers/resumeController');

const router = express.Router();

// All routes require authentication
router.use(protect);

router.post('/upload', uploadResume, uploadResumeController);
router.get('/', getResumes);
router.get('/:id', getResume);
router.delete('/:id', deleteResume);

module.exports = router;
