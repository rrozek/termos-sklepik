import { Product } from '@/interfaces';
import { validateProduct } from './product.validator';
import productRepo from './product.repo';
import { CustomError } from '@/utils/custom-error';

export const getAllProductsService = async (): Promise<Product[]> => {
  return await productRepo.findAllProducts();
};

export const getProductByIdService = async (
  productId: string,
): Promise<Product> => {
  if (!productId) {
    throw new CustomError('Product ID is required', 400);
  }

  const product = await productRepo.findProductById(productId);

  if (!product) {
    throw new CustomError('Product not found', 404);
  }

  return product;
};

export const getProductsByGroupService = async (
  groupId: string,
): Promise<Product[]> => {
  if (!groupId) {
    throw new CustomError('Product group ID is required', 400);
  }

  // Check if group exists
  const groupExists = await productRepo.checkProductGroupExists(groupId);
  if (!groupExists) {
    throw new CustomError('Product group not found', 404);
  }

  return await productRepo.findProductsByGroup(groupId);
};

export const getProductByBarcodeService = async (
  barcode: string,
): Promise<Product> => {
  if (!barcode) {
    throw new CustomError('Barcode is required', 400);
  }

  const product = await productRepo.findProductByBarcode(barcode);

  if (!product) {
    throw new CustomError('Product not found with this barcode', 404);
  }

  return product;
};

export const createProductService = async (
  productData: Product,
): Promise<Product> => {
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
  return await productRepo.createProduct(productData);
};

export const updateProductService = async (
  productId: string,
  productData: Partial<Product>,
): Promise<Product> => {
  // Check if product exists
  const existingProduct = await getProductByIdService(productId);

  // Validate update data
  const { error } = validateProduct(
    { ...existingProduct, ...productData },
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
  if (productData.barcode && productData.barcode !== existingProduct.barcode) {
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
  return await productRepo.updateProduct(productId, productData);
};

export const deleteProductService = async (
  productId: string,
): Promise<void> => {
  // Check if product exists
  await getProductByIdService(productId);

  // Check if product has any order items
  const hasOrderItems = await productRepo.checkProductHasOrderItems(productId);
  if (hasOrderItems) {
    // If product has order items, just deactivate rather than delete
    await productRepo.updateProduct(productId, { is_active: false });
  } else {
    // If no order items, can safely delete
    await productRepo.deleteProduct(productId);
  }
};
