import authRouter from '@/modules/auth/auth.routes';
import userRouter from '@/modules/user/user.routes';
import kidRouter from '@/modules/kid/kid.routes';
import productRouter from '@/modules/product/product.routes';
import productGroupRouter from '@/modules/product-group/product-group.routes';
import orderRouter from '@/modules/order/order.routes';
import discountRouter from '@/modules/discount/discount.routes';
import schoolRouter from '@/modules/school/school.routes';
import express from 'express';
import { authMiddleware } from '@/middlewares/auth.middleware';

const router = express.Router();

// Public routes
router.use('/auth', authRouter);

// Protected routes
router.use('/user', authMiddleware, userRouter);
router.use('/kid', authMiddleware, kidRouter);
router.use('/product', authMiddleware, productRouter);
router.use('/product-group', authMiddleware, productGroupRouter);
router.use('/order', authMiddleware, orderRouter);
router.use('/discount', authMiddleware, discountRouter);
router.use('/school', authMiddleware, schoolRouter);

export default router;
