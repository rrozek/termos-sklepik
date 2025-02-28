import { NextFunction, Request, Response } from 'express';
import { getUserProfileService } from './user.service';
import logger from '@/utils/logger';

export const getUserProfileController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    // Use the userId from JWT context set by the authMiddleware
    const userId = req.context?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    const user = await getUserProfileService(userId);

    res.status(200).json({
      success: true,
      message: 'User profile retrieved successfully',
      data: user,
    });
  } catch (error) {
    logger.error(`Error in getUserProfileController: ${error}`);
    next(error);
  }
};
