import { ProductGroup } from '@/interfaces';
import { validateProductGroup } from './product-group.validator';
import productGroupRepo from './product-group.repo';
import { CustomError } from '@/utils/custom-error';

export const getAllProductGroupsService = async (): Promise<ProductGroup[]> => {
  return await productGroupRepo.findAllProductGroups();
};

export const getProductGroupByIdService = async (
  productGroupId: string,
): Promise<ProductGroup> => {
  if (!productGroupId) {
    throw new CustomError('Product group ID is required', 400);
  }

  const productGroup =
    await productGroupRepo.findProductGroupById(productGroupId);

  if (!productGroup) {
    throw new CustomError('Product group not found', 404);
  }

  return productGroup;
};

export const createProductGroupService = async (
  productGroupData: ProductGroup,
): Promise<ProductGroup> => {
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
  return await productGroupRepo.createProductGroup(productGroupData);
};

export const updateProductGroupService = async (
  productGroupId: string,
  productGroupData: Partial<ProductGroup>,
): Promise<ProductGroup> => {
  // Check if product group exists
  const existingGroup = await getProductGroupByIdService(productGroupId);

  // Validate update data
  const { error } = validateProductGroup(
    { ...existingGroup, ...productGroupData },
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
  return await productGroupRepo.updateProductGroup(
    productGroupId,
    productGroupData,
  );
};

export const deleteProductGroupService = async (
  productGroupId: string,
): Promise<void> => {
  // Check if product group exists
  await getProductGroupByIdService(productGroupId);

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
  await productGroupRepo.deleteProductGroup(productGroupId);
};
