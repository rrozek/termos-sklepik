import { NextFunction, Request, Response } from 'express';
import { CustomError } from '@/utils/custom-error';
import { DJANGO_JWT_SECRET } from '@/config';
import { verifyJWT } from './jwt.service';
import { DB } from '@/database';
import { UserRole } from '@/interfaces';

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.header('Authorization') || req.header('authorization');
  if (!authHeader) {
    throw new CustomError('Authorization header missing', 401);
  }

  try {
    const token = authHeader.replace('Bearer ', '');
    const user = await verifyJWT(token, DJANGO_JWT_SECRET as string);
    req.context = user; // Attach user info to request
    next();
  } catch (error) {
    next(error);
  }
};

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

export const staffMiddleware = async (
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

    if (user.role !== UserRole.ADMIN && user.role !== UserRole.STAFF) {
      throw new CustomError('Access denied: Staff privileges required', 403);
    }

    next();
  } catch (error) {
    next(error);
  }
};
