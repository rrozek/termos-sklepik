import express from 'express';
import {
  createProductGroupController,
  deleteProductGroupController,
  getAllProductGroupsController,
  getProductGroupByIdController,
  updateProductGroupController,
} from './product-group.controller';
import { adminMiddleware } from '@/middlewares/auth.middleware';

const productGroupRouter = express.Router();

// Public routes (available to authenticated users)
productGroupRouter.get('/', getAllProductGroupsController);
productGroupRouter.get('/:id', getProductGroupByIdController);

// Admin-only routes
productGroupRouter.post('/', adminMiddleware, createProductGroupController);
productGroupRouter.put('/:id', adminMiddleware, updateProductGroupController);
productGroupRouter.delete(
  '/:id',
  adminMiddleware,
  deleteProductGroupController,
);

export default productGroupRouter;
