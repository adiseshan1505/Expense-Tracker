import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { HttpError } from '../utils/HttpError.js';

export function notFound(req, _res, next) {
  next(new HttpError(404, `Route not found: ${req.method} ${req.originalUrl}`));
}

export function errorHandler(err, _req, res, _next) {
  let status = err.status ?? err.statusCode ?? 500;
  let { message, details } = err;

  if (err.type === 'entity.parse.failed') {
    message = 'Request body is not valid JSON';
  } else if (err instanceof mongoose.Error.ValidationError) {
    status = 400;
    message = 'Validation failed';
    details = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
  } else if (err instanceof mongoose.Error.CastError) {
    status = 400;
    message = `Invalid value for ${err.path}`;
  } else if (err.code === 11000) {
    status = 409;
    message = 'A record with that value already exists';
  }

  if (status >= 500) {
    console.error(err);
    if (env.isProduction) message = 'Internal server error';
  }

  res.status(status).json({ message, ...(details && { details }) });
}
