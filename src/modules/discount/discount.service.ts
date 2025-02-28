import { Discount } from '@/interfaces';
import { validateDiscount } from './discount.validator';
import discountRepo from './discount.repo';
import { CustomError } from '@/utils/custom-error';

export const getAllDiscountsService = async (): Promise<Discount[]> => {
  return await discountRepo.findAllDiscounts();
};

export const getActiveDiscountsService = async (): Promise<Discount[]> => {
  return await discountRepo.findActiveDiscounts();
};

export const getDiscountByIdService = async (
  discountId: string,
): Promise<Discount> => {
  if (!discountId) {
    throw new CustomError('Discount ID is required', 400);
  }

  const discount = await discountRepo.findDiscountById(discountId);

  if (!discount) {
    throw new CustomError('Discount not found', 404);
  }

  return discount;
};

export const getDiscountsByTargetService = async (
  targetType: string,
  targetId: string,
): Promise<Discount[]> => {
  if (!targetType || !targetId) {
    throw new CustomError('Target type and target ID are required', 400);
  }

  // Validate target type
  const validTargetTypes = ['product', 'product_group', 'order', 'user', 'kid'];
  if (!validTargetTypes.includes(targetType)) {
    throw new CustomError(
      `Invalid target type. Must be one of: ${validTargetTypes.join(', ')}`,
      400,
    );
  }

  return await discountRepo.findDiscountsByTarget(targetType, targetId);
};

export const createDiscountService = async (
  discountData: Discount,
): Promise<Discount> => {
  // Validate discount data
  const { error } = validateDiscount(discountData);
  if (error) {
    throw new CustomError(error.details[0].message, 400);
  }

  // Validate target exists if target_id is provided
  if (discountData.target_id) {
    const targetExists = await discountRepo.checkTargetExists(
      discountData.target_type,
      discountData.target_id,
    );
    if (!targetExists) {
      throw new CustomError(
        `Target ${discountData.target_type} with ID ${discountData.target_id} not found`,
        404,
      );
    }
  }

  // Create the discount
  return await discountRepo.createDiscount(discountData);
};

export const updateDiscountService = async (
  discountId: string,
  discountData: Partial<Discount>,
): Promise<Discount> => {
  // Check if discount exists
  const existingDiscount = await getDiscountByIdService(discountId);

  // Validate update data
  const { error } = validateDiscount(
    { ...existingDiscount, ...discountData },
    true,
  );
  if (error) {
    throw new CustomError(error.details[0].message, 400);
  }

  // Validate target exists if target is being updated
  if (
    discountData.target_id &&
    (discountData.target_id !== existingDiscount.target_id ||
      discountData.target_type !== existingDiscount.target_type)
  ) {
    const targetType = discountData.target_type || existingDiscount.target_type;
    const targetExists = await discountRepo.checkTargetExists(
      targetType,
      discountData.target_id,
    );
    if (!targetExists) {
      throw new CustomError(
        `Target ${targetType} with ID ${discountData.target_id} not found`,
        404,
      );
    }
  }

  // Update the discount
  return await discountRepo.updateDiscount(discountId, discountData);
};

export const deleteDiscountService = async (
  discountId: string,
): Promise<void> => {
  // Check if discount exists
  await getDiscountByIdService(discountId);

  // Delete the discount
  await discountRepo.deleteDiscount(discountId);
};
