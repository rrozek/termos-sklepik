import { NextFunction, Request, Response } from 'express';
import { sendError } from '@/middlewares/response.middleware';
import schoolReportingService from './school-reporting.service';

/**
 * Get school dashboard data
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next function
 */
export const getSchoolDashboardController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { schoolId } = req.params;
    const { period } = req.query;
    const result = await schoolReportingService.getSchoolDashboardService(
      schoolId,
      period as string,
    );
    res.status(200).json(result);
  } catch (error) {
    sendError(res, error);
  }
};

/**
 * Get school daily report
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next function
 */
export const getSchoolDailyReportController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { schoolId } = req.params;
    const { date } = req.query;
    const result = await schoolReportingService.getSchoolDailyReportService(
      schoolId,
      date as string,
    );
    res.status(200).json(result);
  } catch (error) {
    sendError(res, error);
  }
};

/**
 * Get school monthly report
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next function
 */
export const getSchoolMonthlyReportController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { schoolId } = req.params;
    const year = req.query.year
      ? parseInt(req.query.year as string, 10)
      : undefined;
    const month = req.query.month
      ? parseInt(req.query.month as string, 10)
      : undefined;

    const result = await schoolReportingService.getSchoolMonthlyReportService(
      schoolId,
      year,
      month,
    );
    res.status(200).json(result);
  } catch (error) {
    sendError(res, error);
  }
};

/**
 * Get school top products
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next function
 */
export const getSchoolTopProductsController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { schoolId } = req.params;
    const { period, limit } = req.query;

    // Reuse dashboard service but extract only top products
    const result = await schoolReportingService.getSchoolDashboardService(
      schoolId,
      period as string,
    );

    // Extract top products and limit if needed
    const topLimit = limit ? parseInt(limit as string, 10) : 10;
    const topProducts = result.data.top_products.slice(0, topLimit);

    // Create a new response with just the top products
    const response = {
      success: true,
      message: 'School top products retrieved successfully',
      data: {
        school_id: schoolId,
        school_name: result.data.school_name,
        period: period || 'month',
        top_products: topProducts,
      },
    };

    res.status(200).json(response);
  } catch (error) {
    sendError(res, error);
  }
};

export default {
  getSchoolDashboardController,
  getSchoolDailyReportController,
  getSchoolMonthlyReportController,
  getSchoolTopProductsController,
};
