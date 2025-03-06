// modules/product-group/product-group.service.ts

import { ProductGroup } from '@/interfaces';
import { validateProductGroup } from './product-group.validator';
import productGroupRepo from './product-group.repo';
import { CustomError } from '@/utils/custom-error';
import { sendSuccess, sendError } from '@/middlewares/response.middleware';

/**
 * Get all product groups with filtering and pagination
 * @param {Object} queryParams - Query parameters for filtering and pagination
 * @returns {Promise<Object>} Standardized response with product groups data
 */
export const getAllProductGroupsService = async (
  queryParams: any = {},
): Promise<any> => {
  try {
    const result = await productGroupRepo.findAllProductGroups(queryParams);
    return sendSuccess(result.data, 'Product groups retrieved successfully', {
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
 * Get a product group by ID
 * @param {string} productGroupId - Product group ID
 * @returns {Promise<Object>} Standardized response with product group data
 */
export const getProductGroupByIdService = async (
  productGroupId: string,
): Promise<any> => {
  if (!productGroupId) {
    throw new CustomError('Product group ID is required', 400);
  }

  try {
    const productGroup = await productGroupRepo.findById(productGroupId);

    if (!productGroup) {
      throw new CustomError('Product group not found', 404);
    }

    return sendSuccess(productGroup, 'Product group retrieved successfully', {
      isSingleItem: true,
    });
  } catch (error) {
    throw error;
  }
};

/**
 * Create a new product group
 * @param {ProductGroup} productGroupData - Product group data
 * @returns {Promise<Object>} Standardized response with created product group data
 */
export const createProductGroupService = async (
  productGroupData: ProductGroup,
): Promise<any> => {
  try {
    // Validate product group data
    const { error } = validateProductGroup(productGroupData);
    if (error) {
      throw new CustomError(error.details[0].message, 400);
    }

    // Check if product group with same name already exists
    const existingGroup = await productGroupRepo.findProductGroupByName(
      productGroupData.name,
    );
    if (existingGroup) {
      throw new CustomError(
        `Product group with name "${productGroupData.name}" already exists`,
        409,
      );
    }

    // Create the product group
    const productGroup = await productGroupRepo.create(productGroupData);

    return sendSuccess(productGroup, 'Product group created successfully', {
      isSingleItem: true,
    });
  } catch (error) {
    throw error;
  }
};

/**
 * Update an existing product group
 * @param {string} productGroupId - Product group ID
 * @param {Partial<ProductGroup>} productGroupData - Product group data to update
 * @returns {Promise<Object>} Standardized response with updated product group data
 */
export const updateProductGroupService = async (
  productGroupId: string,
  productGroupData: Partial<ProductGroup>,
): Promise<any> => {
  try {
    // Check if product group exists
    const existingGroup = await productGroupRepo.findById(productGroupId);
    if (!existingGroup) {
      throw new CustomError('Product group not found', 404);
    }

    // Validate update data
    const { error } = validateProductGroup(
      { ...existingGroup.get({ plain: true }), ...productGroupData },
      true,
    );
    if (error) {
      throw new CustomError(error.details[0].message, 400);
    }

    // Check if new name conflicts with existing product group
    if (productGroupData.name && productGroupData.name !== existingGroup.name) {
      const nameConflict = await productGroupRepo.findProductGroupByName(
        productGroupData.name,
      );
      if (nameConflict && nameConflict.id !== productGroupId) {
        throw new CustomError(
          `Product group with name "${productGroupData.name}" already exists`,
          409,
        );
      }
    }

    // Update the product group
    await productGroupRepo.update(productGroupId, productGroupData);

    // Get updated product group
    const updatedProductGroup = await productGroupRepo.findById(productGroupId);

    return sendSuccess(
      updatedProductGroup,
      'Product group updated successfully',
      { isSingleItem: true },
    );
  } catch (error) {
    throw error;
  }
};

/**
 * Delete a product group
 * @param {string} productGroupId - Product group ID
 * @returns {Promise<Object>} Standardized response
 */
export const deleteProductGroupService = async (
  productGroupId: string,
): Promise<any> => {
  try {
    // Check if product group exists
    const productGroup = await productGroupRepo.findById(productGroupId);
    if (!productGroup) {
      throw new CustomError('Product group not found', 404);
    }

    // Check if product group has associated products
    const hasProducts =
      await productGroupRepo.checkProductGroupHasProducts(productGroupId);
    if (hasProducts) {
      throw new CustomError(
        'Cannot delete product group that has products. Deactivate it instead or move products to another group.',
        400,
      );
    }

    // Delete the product group
    await productGroupRepo.delete(productGroupId);

    return sendSuccess([], 'Product group deleted successfully');
  } catch (error) {
    throw error;
  }
};
