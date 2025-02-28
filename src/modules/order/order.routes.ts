import express from 'express';
import {
  createOrderController,
  getKidOrdersController,
  getOrderByIdController,
  getParentOrdersController,
  getAllOrdersController,
} from './order.controller';
import { adminMiddleware } from '@/middlewares/admin.middleware';

const orderRouter = express.Router();

// User routes
orderRouter.get('/parent', getParentOrdersController);
orderRouter.get('/kid/:kidId', getKidOrdersController);
orderRouter.get('/:id', getOrderByIdController);
orderRouter.post('/', createOrderController);

// Admin routes
orderRouter.get('/', adminMiddleware, getAllOrdersController);

export default orderRouter;
