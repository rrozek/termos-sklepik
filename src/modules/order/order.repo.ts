// modules/order/order.repo.ts

import { BaseRepository } from '@/base/repository.base';
import { DB } from '@/database';
import { Order, OrderItem } from '@/interfaces';
import { OrderModel } from '@/database/models/order.model';
import { OrderItemModel } from '@/database/models/order-item.model';
import { Op, WhereOptions, Transaction } from 'sequelize';

class OrderRepository extends BaseRepository<OrderModel> {
  constructor() {
    super(DB.Orders);
  }

  /**
   * Find all orders with filtering and pagination
   * @param {Object} queryParams - Request query parameters
   * @returns {Promise<Object>} Orders and pagination metadata
   */
  async findAllOrders(queryParams: any = {}): Promise<any> {
    const { page, limit, skip } = this.getPaginationParams(queryParams);
    const {
      startDate,
      endDate,
      status,
      minAmount,
      maxAmount,
      schoolId,
      productId,
      productGroupId,
    } = queryParams;

    const whereClause: WhereOptions = {};

    // Date range filtering
    if (startDate && endDate) {
      whereClause.created_at = {
        [Op.between]: [new Date(startDate), new Date(endDate)],
      };
    } else if (startDate) {
      whereClause.created_at = {
        [Op.gte]: new Date(startDate),
      };
    } else if (endDate) {
      whereClause.created_at = {
        [Op.lte]: new Date(endDate),
      };
    }

    // Status filtering
    if (status) {
      whereClause.status = status;
    }

    // Amount range filtering
    if (minAmount !== undefined && maxAmount !== undefined) {
      whereClause.total_amount = {
        [Op.between]: [parseFloat(minAmount), parseFloat(maxAmount)],
      };
    } else if (minAmount !== undefined) {
      whereClause.total_amount = {
        ...whereClause.total_amount,
        [Op.gte]: parseFloat(minAmount),
      };
    } else if (maxAmount !== undefined) {
      whereClause.total_amount = {
        ...whereClause.total_amount,
        [Op.lte]: parseFloat(maxAmount),
      };
    }

    // Include associations
    const include: any[] = [
      {
        model: DB.Kids,
        as: 'kid',
        attributes: ['id', 'name'],
      },
      {
        model: DB.Users,
        as: 'parent',
        attributes: ['id', 'name', 'email'],
      },
      {
        model: DB.OrderItems,
        as: 'order_items',
        include: [
          {
            model: DB.Products,
            as: 'product',
            attributes: ['id', 'name', 'image_url', 'product_group_id'],
          },
        ],
      },
    ];

    // School filtering (through kid associations)
    if (schoolId) {
      include[0].include = [
        {
          model: DB.Schools,
          as: 'schools',
          where: { id: schoolId },
          through: { attributes: [] },
          required: true,
        },
      ];
    }

    try {
      // First get IDs of orders with specific products if filtering by product
      if (productId || productGroupId) {
        const orderItemWhere: WhereOptions = {};

        if (productId) {
          orderItemWhere.product_id = productId;
        }

        if (productGroupId) {
          // We need to add a subquery to filter by product group
          const productsInGroup = await DB.Products.findAll({
            attributes: ['id'],
            where: { product_group_id: productGroupId },
            raw: true,
          });

          const productIds = productsInGroup.map(p => p.id);

          if (productIds.length === 0) {
            // No products found in group, return empty result
            return {
              data: [],
              page,
              limit,
              totalItems: 0,
              totalPages: 0,
              hasNextPage: false,
              hasPrevPage: false,
            };
          }

          orderItemWhere.product_id = {
            [Op.in]: productIds,
          };
        }

        const orderItems = await DB.OrderItems.findAll({
          attributes: ['order_id'],
          where: orderItemWhere,
          group: ['order_id'],
          raw: true,
        });

        const orderIds = orderItems.map(item => item.order_id);

        if (orderIds.length === 0) {
          // No orders found with the specified products
          return {
            data: [],
            page,
            limit,
            totalItems: 0,
            totalPages: 0,
            hasNextPage: false,
            hasPrevPage: false,
          };
        }

        whereClause.id = {
          [Op.in]: orderIds,
        };
      }

      // Execute query with all filters
      const { rows, count } = await DB.Orders.findAndCountAll({
        where: whereClause,
        include,
        order: [['created_at', 'DESC']],
        limit,
        offset: skip,
        distinct: true, // Needed for correct count with associations
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
   * Find orders by parent ID with filtering and pagination
   * @param {string} parentId - Parent ID
   * @param {Object} queryParams - Request query parameters
   * @returns {Promise<Object>} Orders and pagination metadata
   */
  async findOrdersByParentId(
    parentId: string,
    queryParams: any = {},
  ): Promise<any> {
    const { page, limit, skip } = this.getPaginationParams(queryParams);
    const {
      startDate,
      endDate,
      status,
      minAmount,
      maxAmount,
      productId,
      productGroupId,
    } = queryParams;

    const whereClause: WhereOptions = {
      parent_id: parentId,
    };

    // Apply same filters as findAllOrders
    if (startDate && endDate) {
      whereClause.created_at = {
        [Op.between]: [new Date(startDate), new Date(endDate)],
      };
    } else if (startDate) {
      whereClause.created_at = {
        [Op.gte]: new Date(startDate),
      };
    } else if (endDate) {
      whereClause.created_at = {
        [Op.lte]: new Date(endDate),
      };
    }

    if (status) {
      whereClause.status = status;
    }

    if (minAmount !== undefined && maxAmount !== undefined) {
      whereClause.total_amount = {
        [Op.between]: [parseFloat(minAmount), parseFloat(maxAmount)],
      };
    } else if (minAmount !== undefined) {
      whereClause.total_amount = {
        ...whereClause.total_amount,
        [Op.gte]: parseFloat(minAmount),
      };
    } else if (maxAmount !== undefined) {
      whereClause.total_amount = {
        ...whereClause.total_amount,
        [Op.lte]: parseFloat(maxAmount),
      };
    }

    const include: any[] = [
      {
        model: DB.Kids,
        as: 'kid',
        attributes: ['id', 'name'],
      },
      {
        model: DB.OrderItems,
        as: 'order_items',
        include: [
          {
            model: DB.Products,
            as: 'product',
            attributes: ['id', 'name', 'image_url', 'product_group_id'],
          },
        ],
      },
    ];

    try {
      // First get IDs of orders with specific products if filtering by product
      if (productId || productGroupId) {
        const orderItemWhere: WhereOptions = {};

        if (productId) {
          orderItemWhere.product_id = productId;
        }

        if (productGroupId) {
          const productsInGroup = await DB.Products.findAll({
            attributes: ['id'],
            where: { product_group_id: productGroupId },
            raw: true,
          });

          const productIds = productsInGroup.map(p => p.id);

          if (productIds.length === 0) {
            return {
              data: [],
              page,
              limit,
              totalItems: 0,
              totalPages: 0,
              hasNextPage: false,
              hasPrevPage: false,
            };
          }

          orderItemWhere.product_id = {
            [Op.in]: productIds,
          };
        }

        const orderItems = await DB.OrderItems.findAll({
          attributes: ['order_id'],
          where: orderItemWhere,
          group: ['order_id'],
          raw: true,
        });

        const orderIds = orderItems.map(item => item.order_id);

        if (orderIds.length === 0) {
          return {
            data: [],
            page,
            limit,
            totalItems: 0,
            totalPages: 0,
            hasNextPage: false,
            hasPrevPage: false,
          };
        }

        whereClause.id = {
          [Op.in]: orderIds,
        };
      }

      const { rows, count } = await DB.Orders.findAndCountAll({
        where: whereClause,
        include,
        order: [['created_at', 'DESC']],
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
   * Find orders by kid ID with filtering and pagination
   * @param {string} kidId - Kid ID
   * @param {Object} queryParams - Request query parameters
   * @returns {Promise<Object>} Orders and pagination metadata
   */
  async findOrdersByKidId(kidId: string, queryParams: any = {}): Promise<any> {
    const { page, limit, skip } = this.getPaginationParams(queryParams);
    const {
      startDate,
      endDate,
      status,
      minAmount,
      maxAmount,
      productId,
      productGroupId,
    } = queryParams;

    const whereClause: WhereOptions = {
      kid_id: kidId,
    };

    // Apply same filters as findAllOrders
    if (startDate && endDate) {
      whereClause.created_at = {
        [Op.between]: [new Date(startDate), new Date(endDate)],
      };
    } else if (startDate) {
      whereClause.created_at = {
        [Op.gte]: new Date(startDate),
      };
    } else if (endDate) {
      whereClause.created_at = {
        [Op.lte]: new Date(endDate),
      };
    }

    if (status) {
      whereClause.status = status;
    }

    if (minAmount !== undefined && maxAmount !== undefined) {
      whereClause.total_amount = {
        [Op.between]: [parseFloat(minAmount), parseFloat(maxAmount)],
      };
    } else if (minAmount !== undefined) {
      whereClause.total_amount = {
        ...whereClause.total_amount,
        [Op.gte]: parseFloat(minAmount),
      };
    } else if (maxAmount !== undefined) {
      whereClause.total_amount = {
        ...whereClause.total_amount,
        [Op.lte]: parseFloat(maxAmount),
      };
    }

    const include: any[] = [
      {
        model: DB.OrderItems,
        as: 'order_items',
        include: [
          {
            model: DB.Products,
            as: 'product',
            attributes: ['id', 'name', 'image_url', 'product_group_id'],
          },
        ],
      },
    ];

    try {
      // First get IDs of orders with specific products if filtering by product
      if (productId || productGroupId) {
        const orderItemWhere: WhereOptions = {};

        if (productId) {
          orderItemWhere.product_id = productId;
        }

        if (productGroupId) {
          const productsInGroup = await DB.Products.findAll({
            attributes: ['id'],
            where: { product_group_id: productGroupId },
            raw: true,
          });

          const productIds = productsInGroup.map(p => p.id);

          if (productIds.length === 0) {
            return {
              data: [],
              page,
              limit,
              totalItems: 0,
              totalPages: 0,
              hasNextPage: false,
              hasPrevPage: false,
            };
          }

          orderItemWhere.product_id = {
            [Op.in]: productIds,
          };
        }

        const orderItems = await DB.OrderItems.findAll({
          attributes: ['order_id'],
          where: orderItemWhere,
          group: ['order_id'],
          raw: true,
        });

        const orderIds = orderItems.map(item => item.order_id);

        if (orderIds.length === 0) {
          return {
            data: [],
            page,
            limit,
            totalItems: 0,
            totalPages: 0,
            hasNextPage: false,
            hasPrevPage: false,
          };
        }

        whereClause.id = {
          [Op.in]: orderIds,
        };
      }

      const { rows, count } = await DB.Orders.findAndCountAll({
        where: whereClause,
        include,
        order: [['created_at', 'DESC']],
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
   * Create an order item
   * @param {OrderItemModel} orderItemData - Order item data
   * @param {Transaction} transaction - Sequelize transaction
   * @returns {Promise<OrderItemModel>} Created order item
   */
  async createOrderItem(
    orderItemData: any,
    transaction?: Transaction,
  ): Promise<OrderItemModel> {
    try {
      return await DB.OrderItems.create(orderItemData, { transaction });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get order statistics
   * @param {string} parentId - Parent ID (optional)
   * @param {string} kidId - Kid ID (optional)
   * @param {string} startDate - Start date (optional)
   * @param {string} endDate - End date (optional)
   * @returns {Promise<Object>} Order statistics
   */
  async getOrderStatistics(
    parentId?: string,
    kidId?: string,
    startDate?: string,
    endDate?: string,
  ): Promise<any> {
    const whereClause: WhereOptions = {};

    if (parentId) {
      whereClause.parent_id = parentId;
    }

    if (kidId) {
      whereClause.kid_id = kidId;
    }

    if (startDate && endDate) {
      whereClause.created_at = {
        [Op.between]: [new Date(startDate), new Date(endDate)],
      };
    } else if (startDate) {
      whereClause.created_at = {
        [Op.gte]: new Date(startDate),
      };
    } else if (endDate) {
      whereClause.created_at = {
        [Op.lte]: new Date(endDate),
      };
    }

    try {
      // Get total orders
      const totalOrders = await DB.Orders.count({
        where: whereClause,
      });

      // Get total amount spent
      const totalSpending = await DB.Orders.sum('total_amount', {
        where: whereClause,
      });

      // Get average order amount
      const avgOrderAmount = totalOrders > 0 ? totalSpending / totalOrders : 0;

      // Get count by status
      const statusCounts = await DB.Orders.findAll({
        attributes: [
          'status',
          [DB.sequelize.fn('COUNT', DB.sequelize.col('status')), 'count'],
        ],
        where: whereClause,
        group: ['status'],
        raw: true,
      });

      // Get popular products
      const popularProducts = await DB.OrderItems.findAll({
        attributes: [
          'product_id',
          'product_name',
          [
            DB.sequelize.fn('SUM', DB.sequelize.col('quantity')),
            'total_quantity',
          ],
          [
            DB.sequelize.fn('COUNT', DB.sequelize.col('order_id')),
            'order_count',
          ],
        ],
        include: [
          {
            model: DB.Orders,
            as: 'order',
            where: whereClause,
            attributes: [],
          },
        ],
        group: ['product_id', 'product_name'],
        order: [[DB.sequelize.fn('SUM', DB.sequelize.col('quantity')), 'DESC']],
        limit: 5,
        raw: true,
      });

      return {
        totalOrders,
        totalSpending,
        avgOrderAmount,
        statusCounts: statusCounts.reduce((acc, curr) => {
          acc[curr.status] = parseInt(curr.count);
          return acc;
        }, {}),
        popularProducts,
      };
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

export default new OrderRepository();
