import express from 'express';
import {
  getAllSchoolsController,
  getSchoolByIdController,
  createSchoolController,
  updateSchoolController,
  deleteSchoolController,
  getSchoolKidsController,
} from './school.controller';
import {
  getSchoolDashboardController,
  getSchoolDailyReportController,
  getSchoolMonthlyReportController,
  getSchoolTopProductsController,
} from './school-reporting.controller';
import {
  adminMiddleware,
  staffMiddleware,
} from '@/middlewares/auth.middleware';

const schoolRouter = express.Router();

// Public routes (available to authenticated users)
schoolRouter.get('/', getAllSchoolsController);
schoolRouter.get('/:id', getSchoolByIdController);

// Admin/Staff-only routes
schoolRouter.post('/', staffMiddleware, createSchoolController);
schoolRouter.put('/:id', staffMiddleware, updateSchoolController);
schoolRouter.delete('/:id', adminMiddleware, deleteSchoolController); // Only admin can delete
schoolRouter.get('/:id/kids', getSchoolKidsController);

// School reporting routes (staff only)
schoolRouter.get(
  '/:schoolId/dashboard',
  staffMiddleware,
  getSchoolDashboardController,
);
schoolRouter.get(
  '/:schoolId/reports/daily',
  staffMiddleware,
  getSchoolDailyReportController,
);
schoolRouter.get(
  '/:schoolId/reports/monthly',
  staffMiddleware,
  getSchoolMonthlyReportController,
);
schoolRouter.get(
  '/:schoolId/top-products',
  staffMiddleware,
  getSchoolTopProductsController,
);

export default schoolRouter;
