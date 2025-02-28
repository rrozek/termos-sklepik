import express from 'express';
import {
  createProductController,
  deleteProductController,
  getAllProductsController,
  getProductByBarcodeController,
  getProductByIdController,
  getProductsByGroupController,
  updateProductController,
} from './product.controller';
import { adminMiddleware } from '@/middlewares/admin.middleware';

const productRouter = express.Router();

// Public routes (available to authenticated users)
productRouter.get('/', getAllProductsController);
productRouter.get('/group/:groupId', getProductsByGroupController);
productRouter.get('/barcode/:barcode', getProductByBarcodeController);
productRouter.get('/:id', getProductByIdController);

// Admin-only routes
productRouter.post('/', adminMiddleware, createProductController);
productRouter.put('/:id', adminMiddleware, updateProductController);
productRouter.delete('/:id', adminMiddleware, deleteProductController);

export default productRouter;
