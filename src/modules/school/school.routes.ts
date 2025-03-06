import express from 'express';
import {
  getAllSchoolsController,
  getSchoolByIdController,
  createSchoolController,
  updateSchoolController,
  deleteSchoolController,
  getSchoolKidsController,
} from './school.controller';
import { adminMiddleware, staffMiddleware } from '@/middlewares/auth.middleware';

const schoolRouter = express.Router();

// Public routes (available to authenticated users)
schoolRouter.get('/', getAllSchoolsController);
schoolRouter.get('/:id', getSchoolByIdController);

// Admin/Staff-only routes
schoolRouter.post('/', staffMiddleware, createSchoolController);
schoolRouter.put('/:id', staffMiddleware, updateSchoolController);
schoolRouter.delete('/:id', adminMiddleware, deleteSchoolController); // Only admin can delete
schoolRouter.get('/:id/kids', getSchoolKidsController);

export default schoolRouter;
