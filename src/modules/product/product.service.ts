// modules/product/product.service.ts

import { Product } from '@/interfaces';
import { validateProduct } from './product.validator';
import productRepo from './product.repo';
import { CustomError } from '@/utils/custom-error';
import { sendSuccess, sendError } from '@/middlewares/response.middleware';
import { DB } from '@/database';
/**
 * Get all products with filtering and pagination
 * @param {Object} queryParams - Query parameters for filtering and pagination
 * @returns {Promise<Object>} Standardized response with products data
 */
export const getAllProductsService = async (
  queryParams: any = {},
): Promise<any> => {
  try {
    const result = await productRepo.findAllProducts(queryParams);
    return sendSuccess(result.data, 'Products retrieved successfully', {
      page: result.page,
      limit: result.limit,
      totalItems: result.totalItems,
      totalPages: result.totalPages,
      hasNextPage: result.hasNextPage,
      hasPrevPage: result.hasPrevPage,
    });
  } catch (error) {
    throw error;
  }
};

/**
 * Get a product by ID
 * @param {string} productId - Product ID
 * @returns {Promise<Object>} Standardized response with product data
 */
export const getProductByIdService = async (
  productId: string,
): Promise<any> => {
  if (!productId) {
    throw new CustomError('Product ID is required', 400);
  }

  try {
    const include = [
      {
        model: DB.ProductGroups,
        as: 'product_group',
        attributes: ['id', 'name'],
      },
    ];

    const product = await productRepo.findById(productId, include);

    if (!product) {
      throw new CustomError('Product not found', 404);
    }

    return sendSuccess(product, 'Product retrieved successfully', {
      isSingleItem: true,
    });
  } catch (error) {
    throw error;
  }
};

/**
 * Get products by group ID with filtering and pagination
 * @param {string} groupId - Product group ID
 * @param {Object} queryParams - Query parameters for filtering and pagination
 * @returns {Promise<Object>} Standardized response with products data
 */
export const getProductsByGroupService = async (
  groupId: string,
  queryParams: any = {},
): Promise<any> => {
  if (!groupId) {
    throw new CustomError('Product group ID is required', 400);
  }

  try {
    // Check if group exists
    const groupExists = await productRepo.checkProductGroupExists(groupId);
    if (!groupExists) {
      throw new CustomError('Product group not found', 404);
    }

    const result = await productRepo.findProductsByGroup(groupId, queryParams);
    return sendSuccess(result.data, 'Products retrieved successfully', {
      page: result.page,
      limit: result.limit,
      totalItems: result.totalItems,
      totalPages: result.totalPages,
      hasNextPage: result.hasNextPage,
      hasPrevPage: result.hasPrevPage,
    });
  } catch (error) {
    throw error;
  }
};

/**
 * Get a product by barcode
 * @param {string} barcode - Product barcode
 * @returns {Promise<Object>} Standardized response with product data
 */
export const getProductByBarcodeService = async (
  barcode: string,
): Promise<any> => {
  if (!barcode) {
    throw new CustomError('Barcode is required', 400);
  }

  try {
    const product = await productRepo.findProductByBarcode(barcode);

    if (!product) {
      throw new CustomError('Product not found with this barcode', 404);
    }

    return sendSuccess(product, 'Product retrieved successfully', {
      isSingleItem: true,
    });
  } catch (error) {
    throw error;
  }
};

/**
 * Create a new product
 * @param {Product} productData - Product data
 * @returns {Promise<Object>} Standardized response with created product data
 */
export const createProductService = async (
  productData: Product,
): Promise<any> => {
  try {
    // Validate product data
    const { error } = validateProduct(productData);
    if (error) {
      throw new CustomError(error.details[0].message, 400);
    }

    // Check if product group exists if provided
    if (productData.product_group_id) {
      const groupExists = await productRepo.checkProductGroupExists(
        productData.product_group_id,
      );
      if (!groupExists) {
        throw new CustomError('Product group not found', 404);
      }
    }

    // Check if barcode is already in use if provided
    if (productData.barcode) {
      const existingProduct = await productRepo.findProductByBarcode(
        productData.barcode,
      );
      if (existingProduct) {
        throw new CustomError(
          `Barcode ${productData.barcode} is already assigned to another product`,
          409,
        );
      }
    }

    // Create the product
    const product = await productRepo.create(productData);

    // Get full product with product group
    const include = [
      {
        model: DB.ProductGroups,
        as: 'product_group',
        attributes: ['id', 'name'],
      },
    ];

    const createdProduct = await productRepo.findById(product.id, include);

    return sendSuccess(createdProduct, 'Product created successfully', {
      isSingleItem: true,
    });
  } catch (error) {
    throw error;
  }
};

/**
 * Update an existing product
 * @param {string} productId - Product ID
 * @param {Partial<Product>} productData - Product data to update
 * @returns {Promise<Object>} Standardized response with updated product data
 */
export const updateProductService = async (
  productId: string,
  productData: Partial<Product>,
): Promise<any> => {
  try {
    // Check if product exists
    const include = [
      {
        model: DB.ProductGroups,
        as: 'product_group',
        attributes: ['id', 'name'],
      },
    ];

    const existingProduct = await productRepo.findById(productId, include);

    if (!existingProduct) {
      throw new CustomError('Product not found', 404);
    }

    // Validate update data
    const { error } = validateProduct(
      { ...existingProduct.get({ plain: true }), ...productData },
      true,
    );
    if (error) {
      throw new CustomError(error.details[0].message, 400);
    }

    // Check if product group exists if being updated
    if (productData.product_group_id) {
      const groupExists = await productRepo.checkProductGroupExists(
        productData.product_group_id,
      );
      if (!groupExists) {
        throw new CustomError('Product group not found', 404);
      }
    }

    // Check if barcode is already in use if being updated
    if (
      productData.barcode &&
      productData.barcode !== existingProduct.barcode
    ) {
      const barcodeProduct = await productRepo.findProductByBarcode(
        productData.barcode,
      );
      if (barcodeProduct && barcodeProduct.id !== productId) {
        throw new CustomError(
          `Barcode ${productData.barcode} is already assigned to another product`,
          409,
        );
      }
    }

    // Update the product
    await productRepo.update(productId, productData);

    // Get updated product
    const updatedProduct = await productRepo.findById(productId, include);

    return sendSuccess(updatedProduct, 'Product updated successfully', {
      isSingleItem: true,
    });
  } catch (error) {
    throw error;
  }
};

/**
 * Delete or deactivate a product
 * @param {string} productId - Product ID
 * @returns {Promise<Object>} Standardized response
 */
export const deleteProductService = async (productId: string): Promise<any> => {
  try {
    // Check if product exists
    const product = await productRepo.findById(productId);

    if (!product) {
      throw new CustomError('Product not found', 404);
    }

    // Check if product has any order items
    const hasOrderItems =
      await productRepo.checkProductHasOrderItems(productId);

    if (hasOrderItems) {
      // If product has order items, just deactivate rather than delete
      await productRepo.update(productId, { is_active: false });
      return sendSuccess([], 'Product deactivated successfully');
    } else {
      // If no order items, can safely delete
      await productRepo.delete(productId);
      return sendSuccess([], 'Product deleted successfully');
    }
  } catch (error) {
    throw error;
  }
};
