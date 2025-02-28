import { DB } from '@/database';
import { ProductCreationAttributes } from '@/database/models/product.model';
import { Product } from '@/interfaces';

const productRepo = {
  findAllProducts: async (): Promise<Product[]> => {
    return await DB.Products.findAll({
      include: [
        {
          model: DB.ProductGroups,
          as: 'product_group',
          attributes: ['id', 'name'],
        },
      ],
      order: [['name', 'ASC']],
    });
  },

  findProductById: async (productId: string): Promise<Product | null> => {
    return await DB.Products.findByPk(productId, {
      include: [
        {
          model: DB.ProductGroups,
          as: 'product_group',
          attributes: ['id', 'name'],
        },
      ],
    });
  },

  findProductsByGroup: async (groupId: string): Promise<Product[]> => {
    return await DB.Products.findAll({
      where: { product_group_id: groupId, is_active: true },
      order: [['name', 'ASC']],
    });
  },

  findProductByBarcode: async (barcode: string): Promise<Product | null> => {
    return await DB.Products.findOne({
      where: { barcode },
      include: [
        {
          model: DB.ProductGroups,
          as: 'product_group',
          attributes: ['id', 'name'],
        },
      ],
    });
  },

  createProduct: async (
    productData: ProductCreationAttributes,
  ): Promise<Product> => {
    return await DB.Products.create(productData);
  },

  updateProduct: async (
    productId: string,
    productData: Partial<Product>,
  ): Promise<Product> => {
    const [_, updatedProducts] = await DB.Products.update(productData, {
      where: { id: productId },
      returning: true,
    });

    return updatedProducts[0];
  },

  deleteProduct: async (productId: string): Promise<number> => {
    return await DB.Products.destroy({ where: { id: productId } });
  },

  checkProductGroupExists: async (groupId: string): Promise<boolean> => {
    const count = await DB.ProductGroups.count({ where: { id: groupId } });
    return count > 0;
  },

  checkProductHasOrderItems: async (productId: string): Promise<boolean> => {
    const count = await DB.OrderItems.count({
      where: { product_id: productId },
    });
    return count > 0;
  },
};

export default productRepo;
