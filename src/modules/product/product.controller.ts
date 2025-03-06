// modules/product/product.controller.ts

import { NextFunction, Request, Response } from 'express';
import {
  createProductService,
  deleteProductService,
  getAllProductsService,
  getProductByBarcodeService,
  getProductByIdService,
  getProductsByGroupService,
  updateProductService,
} from './product.service';

/**
 * Get all products with filtering and pagination
 */
export const getAllProductsController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    // Pass all query parameters to the service
    const result = await getAllProductsService(req.query);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Get a product by ID
 */
export const getProductByIdController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await getProductByIdService(id);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Get products by group ID with filtering and pagination
 */
export const getProductsByGroupController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { groupId } = req.params;
    // Pass all query parameters to the service
    const result = await getProductsByGroupService(groupId, req.query);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Get a product by barcode
 */
export const getProductByBarcodeController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { barcode } = req.params;
    const result = await getProductByBarcodeService(barcode);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new product
 */
export const createProductController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const productData = req.body;
    const result = await createProductService(productData);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Update an existing product
 */
export const updateProductController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;
    const productData = req.body;
    const result = await updateProductService(id, productData);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Delete or deactivate a product
 */
export const deleteProductController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await deleteProductService(id);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
