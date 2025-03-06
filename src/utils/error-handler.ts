// utils/error-handler.ts

import { Request, Response, NextFunction } from 'express';
import { CustomError } from './custom-error';
import { sendError } from '@/middlewares/response.middleware';
import logger from './logger';

export const errorHandler = (
  err: Error | CustomError, // eslint-disable-next-line @typescript-eslint/no-unused-vars
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const statusCode = err instanceof CustomError ? err.statusCode : 500;
  const message = err.message || 'Internal Server Error';

  // Log the error
  if (statusCode >= 500) {
    logger.error(`Server Error: ${err.stack || err.message}`);
  } else {
    logger.warn(`Client Error: ${err.message}`);
  }

  // Return standardized error response
  res.status(statusCode).json(sendError(message, statusCode));
};
