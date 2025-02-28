import { DB } from '@/database';
import { OrderItemCreationAttributes } from '@/database/models/order-item.model';
import { OrderCreationAttributes } from '@/database/models/order.model';
import { Order, OrderItem } from '@/interfaces';
import { Transaction, Op, WhereOptions } from 'sequelize';

interface OrderFilters {
  page: number;
  limit: number;
  startDate?: string;
  endDate?: string;
}

const orderRepo = {
  findAllOrders: async (
    filters: OrderFilters,
  ): Promise<{ orders: Order[]; total: number }> => {
    const { page, limit, startDate, endDate } = filters;
    const offset = (page - 1) * limit;

    const whereClause: WhereOptions = {};

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

    const { count, rows } = await DB.Orders.findAndCountAll({
      where: whereClause,
      include: [
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
              attributes: ['id', 'name', 'image_url'],
            },
          ],
        },
      ],
      order: [['created_at', 'DESC']],
      limit,
      offset,
    });

    return {
      orders: rows,
      total: count,
    };
  },

  findOrdersByParentId: async (
    parentId: string,
    filters: OrderFilters,
  ): Promise<{ orders: Order[]; total: number }> => {
    const { page, limit, startDate, endDate } = filters;
    const offset = (page - 1) * limit;

    const whereClause: WhereOptions = {
      parent_id: parentId,
    };

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

    const { count, rows } = await DB.Orders.findAndCountAll({
      where: whereClause,
      include: [
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
              attributes: ['id', 'name', 'image_url'],
            },
          ],
        },
      ],
      order: [['created_at', 'DESC']],
      limit,
      offset,
    });

    return {
      orders: rows,
      total: count,
    };
  },

  findOrdersByKidId: async (
    kidId: string,
    filters: OrderFilters,
  ): Promise<{ orders: Order[]; total: number }> => {
    const { page, limit, startDate, endDate } = filters;
    const offset = (page - 1) * limit;

    const whereClause: WhereOptions = {
      kid_id: kidId,
    };

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

    const { count, rows } = await DB.Orders.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: DB.OrderItems,
          as: 'order_items',
          include: [
            {
              model: DB.Products,
              as: 'product',
              attributes: ['id', 'name', 'image_url'],
            },
          ],
        },
      ],
      order: [['created_at', 'DESC']],
      limit,
      offset,
    });

    return {
      orders: rows,
      total: count,
    };
  },

  findOrderById: async (orderId: string): Promise<Order | null> => {
    return await DB.Orders.findByPk(orderId, {
      include: [
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
              attributes: ['id', 'name', 'image_url'],
            },
          ],
        },
      ],
    });
  },

  createOrder: async (
    orderData: OrderCreationAttributes,
    transaction?: Transaction,
  ): Promise<Order> => {
    return await DB.Orders.create(orderData, { transaction });
  },

  updateOrder: async (
    orderId: string,
    orderData: Partial<Order>,
    transaction?: Transaction,
  ): Promise<[number, Order[]]> => {
    return await DB.Orders.update(orderData, {
      where: { id: orderId },
      returning: true,
      transaction,
    });
  },

  createOrderItem: async (
    orderItemData: OrderItemCreationAttributes,
    transaction?: Transaction,
  ): Promise<OrderItem> => {
    return await DB.OrderItems.create(orderItemData, { transaction });
  },

  deleteOrder: async (
    orderId: string,
    transaction?: Transaction,
  ): Promise<number> => {
    // First delete associated order items
    await DB.OrderItems.destroy({
      where: { order_id: orderId },
      transaction,
    });

    // Then delete the order
    return await DB.Orders.destroy({
      where: { id: orderId },
      transaction,
    });
  },
};

export default orderRepo;
