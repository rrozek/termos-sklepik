import { NextFunction, Request, Response } from 'express';
import { CustomError } from '@/utils/custom-error';
import { DB } from '@/database';
import { UserRole } from '@/interfaces';

export const adminMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.context || !req.context.userId) {
      throw new CustomError('Unauthorized', 401);
    }

    const userId = req.context.userId;
    const user = await DB.Users.findByPk(userId);

    if (!user) {
      throw new CustomError('User not found', 404);
    }

    if (user.role !== UserRole.ADMIN) {
      throw new CustomError('Access denied: Admin privileges required', 403);
    }

    next();
  } catch (error) {
    next(error);
  }
};
