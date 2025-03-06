// modules/product/product.repo.ts

import { BaseRepository } from '@/base/repository.base';
import { DB } from '@/database';
import { Product } from '@/interfaces';
import { ProductModel } from '@/database/models/product.model';
import { Op, WhereOptions } from 'sequelize';

class ProductRepository extends BaseRepository<ProductModel> {
  constructor() {
    super(DB.Products);
  }

  /**
   * Find all products with filtering and pagination
   * @param {Object} queryParams - Request query parameters
   * @returns {Promise<Object>} Products and pagination metadata
   */
  async findAllProducts(queryParams: any = {}): Promise<any> {
    const { page, limit, skip } = this.getPaginationParams(queryParams);
    const { name, minPrice, maxPrice, isActive, barcode, productGroupId } =
      queryParams;

    const whereClause: WhereOptions = {};

    if (name) {
      whereClause.name = {
        [Op.iLike]: `%${name}%`,
      };
    }

    if (minPrice !== undefined && maxPrice !== undefined) {
      whereClause.price = {
        [Op.between]: [parseFloat(minPrice), parseFloat(maxPrice)],
      };
    } else if (minPrice !== undefined) {
      whereClause.price = {
        ...whereClause.price,
        [Op.gte]: parseFloat(minPrice),
      };
    } else if (maxPrice !== undefined) {
      whereClause.price = {
        ...whereClause.price,
        [Op.lte]: parseFloat(maxPrice),
      };
    }

    if (isActive !== undefined) {
      whereClause.is_active = isActive === 'true';
    }

    if (barcode) {
      whereClause.barcode = {
        [Op.iLike]: `%${barcode}%`,
      };
    }

    if (productGroupId) {
      whereClause.product_group_id = productGroupId;
    }

    const include = [
      {
        model: DB.ProductGroups,
        as: 'product_group',
        attributes: ['id', 'name'],
        required: false,
      },
    ];

    try {
      const { rows, count } = await DB.Products.findAndCountAll({
        where: whereClause,
        include,
        order: [['name', 'ASC']],
        limit,
        offset: skip,
        distinct: true,
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
   * Find products by group ID with filtering and pagination
   * @param {string} groupId - Product group ID
   * @param {Object} queryParams - Request query parameters
   * @returns {Promise<Object>} Products and pagination metadata
   */
  async findProductsByGroup(
    groupId: string,
    queryParams: any = {},
  ): Promise<any> {
    const { page, limit, skip } = this.getPaginationParams(queryParams);
    const { name, minPrice, maxPrice, isActive, barcode } = queryParams;

    const whereClause: WhereOptions = {
      product_group_id: groupId,
    };

    if (name) {
      whereClause.name = {
        [Op.iLike]: `%${name}%`,
      };
    }

    if (minPrice !== undefined && maxPrice !== undefined) {
      whereClause.price = {
        [Op.between]: [parseFloat(minPrice), parseFloat(maxPrice)],
      };
    } else if (minPrice !== undefined) {
      whereClause.price = {
        ...whereClause.price,
        [Op.gte]: parseFloat(minPrice),
      };
    } else if (maxPrice !== undefined) {
      whereClause.price = {
        ...whereClause.price,
        [Op.lte]: parseFloat(maxPrice),
      };
    }

    if (isActive !== undefined) {
      whereClause.is_active = isActive === 'true';
    }

    if (barcode) {
      whereClause.barcode = {
        [Op.iLike]: `%${barcode}%`,
      };
    }

    const include = [
      {
        model: DB.ProductGroups,
        as: 'product_group',
        attributes: ['id', 'name'],
        required: false,
      },
    ];

    try {
      const { rows, count } = await DB.Products.findAndCountAll({
        where: whereClause,
        include,
        order: [['name', 'ASC']],
        limit,
        offset: skip,
        distinct: true,
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
   * Find a product by barcode
   * @param {string} barcode - Product barcode
   * @returns {Promise<ProductModel|null>} Product
   */
  async findProductByBarcode(barcode: string): Promise<ProductModel | null> {
    try {
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
    } catch (error) {
      throw error;
    }
  }

  /**
   * Check if a product has any order items
   * @param {string} productId - Product ID
   * @returns {Promise<boolean>} Whether product has order items
   */
  async checkProductHasOrderItems(productId: string): Promise<boolean> {
    try {
      const count = await DB.OrderItems.count({
        where: { product_id: productId },
      });
      return count > 0;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Check if a product group exists
   * @param {string} groupId - Product group ID
   * @returns {Promise<boolean>} Whether product group exists
   */
  async checkProductGroupExists(groupId: string): Promise<boolean> {
    try {
      const count = await DB.ProductGroups.count({ where: { id: groupId } });
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

export default new ProductRepository();
