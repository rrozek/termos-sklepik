import { NextFunction, Request, Response } from 'express';
import { sendError } from '@/middlewares/response.middleware';
import kidSpendingService from './kid-spending.service';

/**
 * Get kid's remaining budget for the current month
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next function
 */
export const getKidRemainingBudgetController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { kidId } = req.params;
    const result = await kidSpendingService.getKidRemainingBudgetService(kidId);
    res.status(200).json(result);
  } catch (error) {
    sendError(res, error);
  }
};

/**
 * Get kid's spending history
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next function
 */
export const getKidSpendingHistoryController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { kidId } = req.params;
    const result = await kidSpendingService.getKidSpendingHistoryService(
      kidId,
      req.query,
    );
    res.status(200).json(result);
  } catch (error) {
    sendError(res, error);
  }
};

export default {
  getKidRemainingBudgetController,
  getKidSpendingHistoryController,
};
