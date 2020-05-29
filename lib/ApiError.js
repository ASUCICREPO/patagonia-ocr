module.exports = class ApiError extends Error {
  constructor(message, statusCode) {
    super(message || 'Internal Server Error');
    this.name = this.constructor.name;

    Error.captureStackTrace(this, this.constructor);

    this.statusCode = statusCode || 500;
  }
};
