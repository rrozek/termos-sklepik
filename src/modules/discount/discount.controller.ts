import { NextFunction, Request, Response } from 'express';
import {
  createDiscountService,
  deleteDiscountService,
  getAllDiscountsService,
  getActiveDiscountsService,
  getDiscountByIdService,
  getDiscountsByTargetService,
  updateDiscountService,
} from './discount.service';

export const getAllDiscountsController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const discounts = await getAllDiscountsService();

    res.status(200).json({
      success: true,
      message: 'Discounts retrieved successfully',
      data: discounts,
    });
  } catch (error) {
    next(error);
  }
};

export const getActiveDiscountsController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const discounts = await getActiveDiscountsService();

    res.status(200).json({
      success: true,
      message: 'Active discounts retrieved successfully',
      data: discounts,
    });
  } catch (error) {
    next(error);
  }
};

export const getDiscountByIdController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;
    const discount = await getDiscountByIdService(id);

    res.status(200).json({
      success: true,
      message: 'Discount retrieved successfully',
      data: discount,
    });
  } catch (error) {
    next(error);
  }
};

export const getDiscountsByTargetController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { type, id } = req.params;
    const discounts = await getDiscountsByTargetService(type, id);

    res.status(200).json({
      success: true,
      message: 'Discounts retrieved successfully',
      data: discounts,
    });
  } catch (error) {
    next(error);
  }
};

export const createDiscountController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const discountData = req.body;
    const newDiscount = await createDiscountService(discountData);

    res.status(201).json({
      success: true,
      message: 'Discount created successfully',
      data: newDiscount,
    });
  } catch (error) {
    next(error);
  }
};

export const updateDiscountController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;
    const discountData = req.body;

    const updatedDiscount = await updateDiscountService(id, discountData);

    res.status(200).json({
      success: true,
      message: 'Discount updated successfully',
      data: updatedDiscount,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteDiscountController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;

    await deleteDiscountService(id);

    res.status(200).json({
      success: true,
      message: 'Discount deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
