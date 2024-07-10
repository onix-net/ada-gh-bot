// src/utils/errors.js
export class AppError extends Error {
  constructor(message, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export function isOperationalError(error) {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  return false;
}
