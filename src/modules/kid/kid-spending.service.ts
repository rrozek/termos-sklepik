import { DB } from '@/database';
import { CustomError } from '@/utils/custom-error';
import { sendSuccess } from '@/middlewares/response.middleware';
import kidMonthlySpendingRepo from './kid-monthly-spending.repo';
import { Op } from 'sequelize';

/**
 * Get kid's remaining budget for the current month
 * @param {string} kidId - Kid ID
 * @returns {Promise<any>} Standardized response with remaining budget data
 */
export const getKidRemainingBudgetService = async (
  kidId: string,
): Promise<any> => {
  try {
    const kid = await DB.Kids.findByPk(kidId);
    if (!kid) {
      throw new CustomError('Kid not found', 404);
    }

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1; // JavaScript months are 0-indexed

    // Get current monthly spending
    const monthlySpending = await kidMonthlySpendingRepo.getKidMonthlySpending(
      kidId,
      year,
      month,
    );

    const currentSpending = parseFloat(
      monthlySpending.spending_amount.toString(),
    );
    const spendingLimit = kid.monthly_spending_limit
      ? parseFloat(kid.monthly_spending_limit.toString())
      : null;

    const remainingBudget =
      spendingLimit !== null ? spendingLimit - currentSpending : null;

    return sendSuccess(
      {
        kid_id: kidId,
        kid_name: kid.name,
        year,
        month,
        current_spending: currentSpending,
        spending_limit: spendingLimit,
        remaining_budget: remainingBudget,
        has_limit: spendingLimit !== null,
      },
      'Kid remaining budget retrieved successfully',
      { isSingleItem: true },
    );
  } catch (error) {
    throw error;
  }
};

/**
 * Get kid's monthly spending history
 * @param {string} kidId - Kid ID
 * @param {Object} queryParams - Query parameters for filtering
 * @returns {Promise<any>} Standardized response with spending history data
 */
export const getKidSpendingHistoryService = async (
  kidId: string,
  queryParams: any = {},
): Promise<any> => {
  try {
    const kid = await DB.Kids.findByPk(kidId);
    if (!kid) {
      throw new CustomError('Kid not found', 404);
    }

    // Parse query parameters
    const year = queryParams.year ? parseInt(queryParams.year, 10) : null;
    const month = queryParams.month ? parseInt(queryParams.month, 10) : null;
    const startDate = queryParams.start_date
      ? new Date(queryParams.start_date)
      : null;
    const endDate = queryParams.end_date
      ? new Date(queryParams.end_date)
      : null;

    // Build where clause
    const where: any = {
      kid_id: kidId,
    };

    if (year) {
      where.year = year;
    }

    if (month) {
      where.month = month;
    }

    // Get monthly spending records
    const spendingRecords = await DB.KidMonthlySpendings.findAll({
      where,
      order: [
        ['year', 'DESC'],
        ['month', 'DESC'],
      ],
    });

    // Get orders for detailed spending
    const orderWhere: any = {
      kid_id: kidId,
    };

    if (startDate || endDate) {
      orderWhere.created_at = {};

      if (startDate) {
        orderWhere.created_at[Op.gte] = startDate;
      }

      if (endDate) {
        orderWhere.created_at[Op.lte] = endDate;
      }
    } else if (year && month) {
      const startOfMonth = new Date(year, month - 1, 1);
      const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

      orderWhere.created_at = {
        [Op.between]: [startOfMonth, endOfMonth],
      };
    }

    const orders = await DB.Orders.findAll({
      where: orderWhere,
      include: [
        {
          model: DB.OrderItems,
          as: 'order_items',
          include: [
            {
              model: DB.Products,
              as: 'product',
              attributes: ['id', 'name', 'product_group_id'],
              include: [
                {
                  model: DB.ProductGroups,
                  as: 'product_group',
                  attributes: ['id', 'name'],
                },
              ],
            },
          ],
        },
      ],
      order: [['created_at', 'DESC']],
    });

    // Calculate spending by product group
    const spendingByProductGroup: Record<string, number> = {};
    const spendingByProduct: Record<string, number> = {};

    orders.forEach(order => {
      order.order_items.forEach(item => {
        // Product group spending
        const productGroupId = item.product.product_group_id;
        const productGroupName = item.product.product_group.name;
        const key = `${productGroupId}:${productGroupName}`;

        if (!spendingByProductGroup[key]) {
          spendingByProductGroup[key] = 0;
        }

        spendingByProductGroup[key] += parseFloat(item.total_price.toString());

        // Product spending
        const productId = item.product_id;
        const productName = item.product_name;
        const productKey = `${productId}:${productName}`;

        if (!spendingByProduct[productKey]) {
          spendingByProduct[productKey] = 0;
        }

        spendingByProduct[productKey] += parseFloat(
          item.total_price.toString(),
        );
      });
    });

    // Format product group spending for response
    const productGroupSpending = Object.entries(spendingByProductGroup).map(
      ([key, amount]) => {
        const [id, name] = key.split(':');
        return {
          product_group_id: id,
          product_group_name: name,
          amount,
        };
      },
    );

    // Format product spending for response
    const productSpending = Object.entries(spendingByProduct).map(
      ([key, amount]) => {
        const [id, name] = key.split(':');
        return {
          product_id: id,
          product_name: name,
          amount,
        };
      },
    );

    // Sort by amount (highest first)
    productGroupSpending.sort((a, b) => b.amount - a.amount);
    productSpending.sort((a, b) => b.amount - a.amount);

    return sendSuccess(
      {
        kid_id: kidId,
        kid_name: kid.name,
        monthly_records: spendingRecords,
        orders: orders.map(order => ({
          id: order.id,
          date: order.created_at,
          total_amount: order.total_amount,
          items_count: order.order_items.length,
        })),
        spending_by_product_group: productGroupSpending,
        spending_by_product: productSpending,
        total_orders: orders.length,
        total_spent: orders.reduce(
          (sum, order) => sum + parseFloat(order.total_amount.toString()),
          0,
        ),
      },
      'Kid spending history retrieved successfully',
      { isSingleItem: true },
    );
  } catch (error) {
    throw error;
  }
};

export default {
  getKidRemainingBudgetService,
  getKidSpendingHistoryService,
};
