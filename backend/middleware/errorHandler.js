const AppError = require('../utils/AppError');

// Global error handling middleware
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  error.statusCode = err.statusCode || 500;

  // Log error in development
  if (process.env.NODE_ENV === 'development') {
    console.error('🔴 Error:', {
      name: err.name,
      message: err.message,
      stack: err.stack,
      statusCode: error.statusCode,
    });
  } else {
    // Log minimal in production
    if (error.statusCode >= 500) {
      console.error(`🔴 Server Error [${new Date().toISOString()}]: ${err.message}`);
    }
  }

  // MongoDB duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const value = err.keyValue[field];
    error = new AppError(`An account with ${field} "${value}" already exists. Please use a different ${field}.`, 409);
  }

  // MongoDB validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    error = new AppError(messages.join('. '), 400);
  }

  // MongoDB CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    error = new AppError(`Invalid ${err.path}: ${err.value}. Please provide a valid ID.`, 400);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = new AppError('Invalid token. Please log in again.', 401);
  }
  if (err.name === 'TokenExpiredError') {
    error = new AppError('Your session has expired. Please log in again.', 401);
  }

  // Multer errors
  if (err.name === 'MulterError') {
    error = new AppError(`File upload error: ${err.message}`, 400);
  }

  const response = {
    success: false,
    status: error.statusCode >= 500 ? 'error' : 'fail',
    message: error.message || 'An unexpected error occurred. Please try again.',
  };

  // Include stack trace in development
  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
  }

  res.status(error.statusCode).json(response);
};

// 404 handler for unmatched routes
const notFound = (req, res, next) => {
  next(new AppError(`Route ${req.originalUrl} not found on this server.`, 404));
};

module.exports = { errorHandler, notFound };
