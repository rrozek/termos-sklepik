import express from 'express';
import {
  createOrderController,
  getKidOrdersController,
  getOrderByIdController,
  getParentOrdersController,
  getAllOrdersController,
  getOrderStatisticsController,
  updateOrderStatusController,
  cancelOrderController,
} from './order.controller';
import {
  adminMiddleware,
  staffMiddleware,
} from '@/middlewares/auth.middleware';

const orderRouter = express.Router();

// User routes
orderRouter.get('/parent', getParentOrdersController);
orderRouter.get('/kid/:kidId', getKidOrdersController);
orderRouter.get('/statistics', getOrderStatisticsController);
orderRouter.get('/:id', getOrderByIdController);
orderRouter.post('/', createOrderController);
orderRouter.patch('/:id/status', updateOrderStatusController);
orderRouter.patch('/:id/cancel', cancelOrderController);

// Admin/Staff routes
orderRouter.get('/', staffMiddleware, getAllOrdersController);

export default orderRouter;
