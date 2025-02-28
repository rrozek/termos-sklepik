import axios from 'axios';
import { NextFunction, Request, Response } from 'express';
import { CustomError } from '@/utils/custom-error';
import { BASE_URL, DJANGO_JWT_SECRET } from '@/config';
import { verifyJWT } from './jwt.service';

const validateTokenWithDjango = async (token: string) => {
  try {
    const response = await axios.post(`${BASE_URL}/auth/verify/`, {
      token,
    });

    return response.data; // Expected to return user info if valid
  } catch (error) {
    throw new CustomError('Invalid or expired token', 401);
  }
};

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
