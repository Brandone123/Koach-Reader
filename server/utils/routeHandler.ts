import { Request, Response, NextFunction } from 'express';

// Define a type for async request handlers that properly handles return types
type AsyncRequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<any>;

/**
 * Wraps an async route handler to avoid try/catch blocks in every handler
 * @param fn The async function to wrap
 * @returns A wrapped function that handles errors
 */
export const asyncHandler = (fn: AsyncRequestHandler) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await fn(req, res, next);
    } catch (error) {
      next(error);
    }
  };
};