import express from 'express';
import {
  createDiscountController,
  deleteDiscountController,
  getAllDiscountsController,
  getActiveDiscountsController,
  getDiscountByIdController,
  getDiscountsByTargetController,
  updateDiscountController,
} from './discount.controller';
import { adminMiddleware } from '@/middlewares/admin.middleware';

const discountRouter = express.Router();

// Public routes (available to authenticated users)
discountRouter.get('/', getAllDiscountsController);
discountRouter.get('/active', getActiveDiscountsController);
discountRouter.get('/target/:type/:id', getDiscountsByTargetController);
discountRouter.get('/:id', getDiscountByIdController);

// Admin-only routes
discountRouter.post('/', adminMiddleware, createDiscountController);
discountRouter.put('/:id', adminMiddleware, updateDiscountController);
discountRouter.delete('/:id', adminMiddleware, deleteDiscountController);

export default discountRouter;
