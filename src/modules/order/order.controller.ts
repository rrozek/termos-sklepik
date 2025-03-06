// modules/order/order.controller.ts

import { NextFunction, Request, Response } from 'express';
import {
  createOrderService,
  getAllOrdersService,
  getKidOrdersService,
  getOrderByIdService,
  getParentOrdersService,
  getOrderStatisticsService,
  updateOrderStatusService,
  cancelOrderService,
} from './order.service';

/**
 * Get all orders (admin/staff only)
 */
export const getAllOrdersController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    // Pass all query parameters to the service
    const result = await getAllOrdersService(req.query);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Get orders for authenticated parent
 */
export const getParentOrdersController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const parentId = req.context?.userId;
    // Pass all query parameters to the service
    const result = await getParentOrdersService(parentId, req.query);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Get orders for a specific kid
 */
export const getKidOrdersController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const parentId = req.context?.userId;
    const { kidId } = req.params;
    // Pass all query parameters to the service
    const result = await getKidOrdersService(kidId, parentId, req.query);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Get an order by ID
 */
export const getOrderByIdController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.context?.userId;
    const result = await getOrderByIdService(id, userId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Get order statistics
 */
export const getOrderStatisticsController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.context?.userId;
    const { kidId, startDate, endDate } = req.query;

    const result = await getOrderStatisticsService(
      userId,
      kidId as string,
      startDate as string,
      endDate as string,
    );
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new order
 */
export const createOrderController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const orderData = req.body;
    const userId = req.context?.userId;
    const result = await createOrderService(orderData, userId);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Update order status
 */
export const updateOrderStatusController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.context?.userId;

    if (!status) {
      throw new Error('Status is required');
    }

    const result = await updateOrderStatusService(id, status, userId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Cancel an order
 */
export const cancelOrderController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.context?.userId;
    const result = await cancelOrderService(id, userId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
