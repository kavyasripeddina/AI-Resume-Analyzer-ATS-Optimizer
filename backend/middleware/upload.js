const multer = require('multer');
const path = require('path');
const AppError = require('../utils/AppError');

// Serverless-friendly Storage configuration (Memory)
const storage = multer.memoryStorage();

// File filter — only allow PDF and DOCX
const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
  ];
  const allowedExts = ['.pdf', '.docx', '.doc'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedMimes.includes(file.mimetype) && allowedExts.includes(ext)) {
    cb(null, true);
  } else {
    cb(new AppError('Only PDF and DOCX files are allowed. Please upload a valid resume file.', 400), false);
  }
};

// Max file size: 10MB
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024;

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1,
  },
});

// Middleware wrapper with custom error handling
const uploadResume = (req, res, next) => {
  upload.single('resume')(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return next(new AppError(`File size exceeds the ${MAX_FILE_SIZE / 1024 / 1024}MB limit. Please upload a smaller file.`, 400));
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
          return next(new AppError('Only one file can be uploaded at a time.', 400));
        }
        return next(new AppError(`Upload error: ${err.message}`, 400));
      }
      return next(err);
    }

    if (!req.file) {
      return next(new AppError('No file uploaded. Please select a PDF or DOCX resume file.', 400));
    }

    next();
  });
};

module.exports = { uploadResume };
