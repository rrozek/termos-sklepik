import { NextFunction, Request, Response } from 'express';
import {
  createOrderService,
  getAllOrdersService,
  getKidOrdersService,
  getOrderByIdService,
  getParentOrdersService,
} from './order.service';

export const getAllOrdersController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { page = '1', limit = '10', startDate, endDate } = req.query;

    const orders = await getAllOrdersService({
      page: parseInt(page as string, 10),
      limit: parseInt(limit as string, 10),
      startDate: startDate as string,
      endDate: endDate as string,
    });

    res.status(200).json({
      success: true,
      message: 'Orders retrieved successfully',
      data: orders,
    });
  } catch (error) {
    next(error);
  }
};

export const getParentOrdersController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const parentId = req.context?.userId;
    const { page = '1', limit = '10', startDate, endDate } = req.query;

    const orders = await getParentOrdersService(parentId, {
      page: parseInt(page as string, 10),
      limit: parseInt(limit as string, 10),
      startDate: startDate as string,
      endDate: endDate as string,
    });

    res.status(200).json({
      success: true,
      message: 'Orders retrieved successfully',
      data: orders,
    });
  } catch (error) {
    next(error);
  }
};

export const getKidOrdersController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const parentId = req.context?.userId;
    const { kidId } = req.params;
    const { page = '1', limit = '10', startDate, endDate } = req.query;

    const orders = await getKidOrdersService(kidId, parentId, {
      page: parseInt(page as string, 10),
      limit: parseInt(limit as string, 10),
      startDate: startDate as string,
      endDate: endDate as string,
    });

    res.status(200).json({
      success: true,
      message: 'Orders retrieved successfully',
      data: orders,
    });
  } catch (error) {
    next(error);
  }
};

export const getOrderByIdController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.context?.userId;
    const order = await getOrderByIdService(id, userId);

    res.status(200).json({
      success: true,
      message: 'Order retrieved successfully',
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

export const createOrderController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const orderData = req.body;
    const userId = req.context?.userId;

    const newOrder = await createOrderService(orderData, userId);

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: newOrder,
    });
  } catch (error) {
    next(error);
  }
};
