import { Request, Response, NextFunction } from 'express';

export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const error = new Error(`Route not found: ${req.originalUrl}`);
  res.status(404).json({
    status: 'error',
    message: error.message,
  });
};
