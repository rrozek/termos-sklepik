import { NextFunction, Request, Response } from 'express';
import { signInService, signUpService } from './auth.service';

export const signUpController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userData = req.body;
    const response = await signUpService(userData);

    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
};

export const signInController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userData = req.body;
    const response = await signInService(userData);

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};
