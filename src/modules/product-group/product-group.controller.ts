// modules/product-group/product-group.controller.ts

import { NextFunction, Request, Response } from 'express';
import {
  createProductGroupService,
  deleteProductGroupService,
  getAllProductGroupsService,
  getProductGroupByIdService,
  updateProductGroupService,
} from './product-group.service';

/**
 * Get all product groups with filtering and pagination
 */
export const getAllProductGroupsController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    // Pass all query parameters to the service
    const result = await getAllProductGroupsService(req.query);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Get a product group by ID
 */
export const getProductGroupByIdController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await getProductGroupByIdService(id);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new product group
 */
export const createProductGroupController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const productGroupData = req.body;
    const result = await createProductGroupService(productGroupData);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Update an existing product group
 */
export const updateProductGroupController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;
    const productGroupData = req.body;
    const result = await updateProductGroupService(id, productGroupData);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a product group
 */
export const deleteProductGroupController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await deleteProductGroupService(id);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
