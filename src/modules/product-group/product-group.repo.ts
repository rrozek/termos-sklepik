import { DB } from '@/database';
import { ProductGroupCreationAttributes } from '@/database/models/product-group.model';
import { ProductGroup } from '@/interfaces';

const productGroupRepo = {
  findAllProductGroups: async (): Promise<ProductGroup[]> => {
    return await DB.ProductGroups.findAll({
      order: [['name', 'ASC']],
    });
  },

  findProductGroupById: async (
    productGroupId: string,
  ): Promise<ProductGroup | null> => {
    return await DB.ProductGroups.findByPk(productGroupId);
  },

  findProductGroupByName: async (
    name: string,
  ): Promise<ProductGroup | null> => {
    return await DB.ProductGroups.findOne({
      where: { name },
    });
  },

  createProductGroup: async (
    productGroupData: ProductGroupCreationAttributes,
  ): Promise<ProductGroup> => {
    return await DB.ProductGroups.create(productGroupData);
  },

  updateProductGroup: async (
    productGroupId: string,
    productGroupData: Partial<ProductGroup>,
  ): Promise<ProductGroup> => {
    const [_, updatedGroups] = await DB.ProductGroups.update(productGroupData, {
      where: { id: productGroupId },
      returning: true,
    });

    return updatedGroups[0];
  },

  deleteProductGroup: async (productGroupId: string): Promise<number> => {
    return await DB.ProductGroups.destroy({ where: { id: productGroupId } });
  },

  checkProductGroupHasProducts: async (
    productGroupId: string,
  ): Promise<boolean> => {
    const count = await DB.Products.count({
      where: { product_group_id: productGroupId },
    });
    return count > 0;
  },
};

export default productGroupRepo;
