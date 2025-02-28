import { NextFunction, Request, Response } from 'express';
import {
  createProductGroupService,
  deleteProductGroupService,
  getAllProductGroupsService,
  getProductGroupByIdService,
  updateProductGroupService,
} from './product-group.service';

export const getAllProductGroupsController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const productGroups = await getAllProductGroupsService();

    res.status(200).json({
      success: true,
      message: 'Product groups retrieved successfully',
      data: productGroups,
    });
  } catch (error) {
    next(error);
  }
};

export const getProductGroupByIdController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;
    const productGroup = await getProductGroupByIdService(id);

    res.status(200).json({
      success: true,
      message: 'Product group retrieved successfully',
      data: productGroup,
    });
  } catch (error) {
    next(error);
  }
};

export const createProductGroupController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const productGroupData = req.body;
    const newProductGroup = await createProductGroupService(productGroupData);

    res.status(201).json({
      success: true,
      message: 'Product group created successfully',
      data: newProductGroup,
    });
  } catch (error) {
    next(error);
  }
};

export const updateProductGroupController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;
    const productGroupData = req.body;

    const updatedProductGroup = await updateProductGroupService(
      id,
      productGroupData,
    );

    res.status(200).json({
      success: true,
      message: 'Product group updated successfully',
      data: updatedProductGroup,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteProductGroupController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;

    await deleteProductGroupService(id);

    res.status(200).json({
      success: true,
      message: 'Product group deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
