// modules/product-group/product-group.repo.ts

import { BaseRepository } from '@/base/repository.base';
import { DB } from '@/database';
import { ProductGroupModel } from '@/database/models/product-group.model';
import { Op, WhereOptions } from 'sequelize';

class ProductGroupRepository extends BaseRepository<ProductGroupModel> {
  constructor() {
    super(DB.ProductGroups);
  }

  /**
   * Find all product groups with filtering and pagination
   * @param {Object} queryParams - Request query parameters
   * @returns {Promise<Object>} Product groups and pagination metadata
   */
  async findAllProductGroups(queryParams: any = {}): Promise<any> {
    const { page, limit, skip } = this.getPaginationParams(queryParams);
    const { name, isActive } = queryParams;

    const whereClause: WhereOptions = {};

    if (name) {
      whereClause.name = {
        [Op.iLike]: `%${name}%`,
      };
    }

    if (isActive !== undefined) {
      whereClause.is_active = isActive === 'true';
    }

    try {
      const { rows, count } = await DB.ProductGroups.findAndCountAll({
        where: whereClause,
        order: [['name', 'ASC']],
        limit,
        offset: skip,
      });

      return {
        data: rows,
        page,
        limit,
        totalItems: count,
        totalPages: Math.ceil(count / limit),
        hasNextPage: page < Math.ceil(count / limit),
        hasPrevPage: page > 1,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Find a product group by name
   * @param {string} name - Product group name
   * @returns {Promise<ProductGroupModel|null>} Product group
   */
  async findProductGroupByName(
    name: string,
  ): Promise<ProductGroupModel | null> {
    try {
      return await DB.ProductGroups.findOne({
        where: { name },
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Check if a product group has associated products
   * @param {string} productGroupId - Product group ID
   * @returns {Promise<boolean>} Whether product group has products
   */
  async checkProductGroupHasProducts(productGroupId: string): Promise<boolean> {
    try {
      const count = await DB.Products.count({
        where: { product_group_id: productGroupId },
      });
      return count > 0;
    } catch (error) {
      throw error;
    }
  }

  // Helper method to get pagination parameters
  private getPaginationParams(query: any) {
    const page = parseInt(query.page?.toString() || '1', 10);
    const limit = parseInt(query.limit?.toString() || '10', 10);
    const skip = (page - 1) * limit;

    return { page, limit, skip };
  }
}

export default new ProductGroupRepository();
