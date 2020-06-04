module.exports = class ApiError extends Error {
  // Simple Error wrapper to pass a statusCode to response
  constructor(message, statusCode) {
    super(message || 'Internal Server Error');
    this.name = this.constructor.name;

    Error.captureStackTrace(this, this.constructor);

    this.statusCode = statusCode || 500;
  }
};
