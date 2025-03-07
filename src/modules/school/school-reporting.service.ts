import { DB } from '@/database';
import { CustomError } from '@/utils/custom-error';
import { sendSuccess } from '@/middlewares/response.middleware';
import { Op } from 'sequelize';

/**
 * Get period dates based on period string
 * @param {string} period - Period string (day, week, month, year)
 * @returns {Object} Start and end dates for the period
 */
const getPeriodDates = (period: string): { startDate: Date; endDate: Date } => {
  const now = new Date();
  const endDate = new Date(now);
  let startDate = new Date(now);

  switch (period) {
    case 'day':
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      break;
    case 'week':
      // Set to beginning of current week (Monday)
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      startDate = new Date(now.setDate(diff));
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      break;
    case 'month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0,
        23,
        59,
        59,
        999,
      );
      break;
    case 'year':
      startDate = new Date(now.getFullYear(), 0, 1);
      endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
      break;
    default:
      // Custom date range should be handled by the caller
      break;
  }

  return { startDate, endDate };
};

/**
 * Get school dashboard data
 * @param {string} schoolId - School ID
 * @param {string} period - Period (day, week, month, year)
 * @returns {Promise<any>} Standardized response with dashboard data
 */
export const getSchoolDashboardService = async (
  schoolId: string,
  period: string = 'month',
): Promise<any> => {
  try {
    const school = await DB.Schools.findByPk(schoolId);
    if (!school) {
      throw new CustomError('School not found', 404);
    }

    // Get period dates
    const { startDate, endDate } = getPeriodDates(period);

    // Get kids in this school
    const kidSchools = await DB.KidSchools.findAll({
      where: {
        school_id: schoolId,
      },
      attributes: ['kid_id'],
    });

    const kidIds = kidSchools.map(ks => ks.kid_id);

    // Get orders for these kids in the specified period
    const orders = await DB.Orders.findAll({
      where: {
        kid_id: {
          [Op.in]: kidIds,
        },
        created_at: {
          [Op.between]: [startDate, endDate],
        },
      },
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
    });

    // Calculate total orders and amount
    const totalOrders = orders.length;
    const totalAmount = orders.reduce(
      (sum, order) => sum + parseFloat(order.total_amount.toString()),
      0,
    );

    // Get active kids count
    const activeKidsCount = await DB.Kids.count({
      where: {
        id: {
          [Op.in]: kidIds,
        },
        is_active: true,
      },
    });

    // Calculate top products
    const productCounts: Record<string, { count: number; amount: number }> = {};
    const productGroupCounts: Record<
      string,
      { count: number; amount: number }
    > = {};

    orders.forEach(order => {
      order.order_items.forEach(item => {
        // Product counts
        const productId = item.product_id;
        const productName = item.product_name;
        const productKey = `${productId}:${productName}`;

        if (!productCounts[productKey]) {
          productCounts[productKey] = { count: 0, amount: 0 };
        }

        productCounts[productKey].count += item.quantity;
        productCounts[productKey].amount += parseFloat(
          item.total_price.toString(),
        );

        // Product group counts
        const productGroupId = item.product.product_group_id;
        const productGroupName = item.product.product_group.name;
        const groupKey = `${productGroupId}:${productGroupName}`;

        if (!productGroupCounts[groupKey]) {
          productGroupCounts[groupKey] = { count: 0, amount: 0 };
        }

        productGroupCounts[groupKey].count += item.quantity;
        productGroupCounts[groupKey].amount += parseFloat(
          item.total_price.toString(),
        );
      });
    });

    // Format top products for response
    const topProducts = Object.entries(productCounts)
      .map(([key, data]) => {
        const [id, name] = key.split(':');
        return {
          product_id: id,
          product_name: name,
          quantity_sold: data.count,
          total_amount: data.amount,
        };
      })
      .sort((a, b) => b.quantity_sold - a.quantity_sold)
      .slice(0, 5);

    // Format top product groups for response
    const topProductGroups = Object.entries(productGroupCounts)
      .map(([key, data]) => {
        const [id, name] = key.split(':');
        return {
          product_group_id: id,
          product_group_name: name,
          quantity_sold: data.count,
          total_amount: data.amount,
        };
      })
      .sort((a, b) => b.quantity_sold - a.quantity_sold)
      .slice(0, 5);

    // Get top spending kids
    const kidSpending: Record<string, { amount: number; name: string }> = {};

    orders.forEach(order => {
      const kidId = order.kid_id;
      const kidName = order.kid.name;

      if (!kidSpending[kidId]) {
        kidSpending[kidId] = { amount: 0, name: kidName };
      }

      kidSpending[kidId].amount += parseFloat(order.total_amount.toString());
    });

    const topSpendingKids = Object.entries(kidSpending)
      .map(([kidId, data]) => ({
        kid_id: kidId,
        kid_name: data.name,
        total_spent: data.amount,
      }))
      .sort((a, b) => b.total_spent - a.total_spent)
      .slice(0, 5);

    return sendSuccess(
      {
        school_id: schoolId,
        school_name: school.name,
        period,
        period_start: startDate,
        period_end: endDate,
        total_orders: totalOrders,
        total_amount: totalAmount,
        active_kids_count: activeKidsCount,
        top_products: topProducts,
        top_product_groups: topProductGroups,
        top_spending_kids: topSpendingKids,
      },
      'School dashboard data retrieved successfully',
      { isSingleItem: true },
    );
  } catch (error) {
    throw error;
  }
};

/**
 * Get school daily report
 * @param {string} schoolId - School ID
 * @param {string} date - Date string (YYYY-MM-DD)
 * @returns {Promise<any>} Standardized response with daily report data
 */
export const getSchoolDailyReportService = async (
  schoolId: string,
  date?: string,
): Promise<any> => {
  try {
    const school = await DB.Schools.findByPk(schoolId);
    if (!school) {
      throw new CustomError('School not found', 404);
    }

    // Parse date or use today
    const reportDate = date ? new Date(date) : new Date();
    const startDate = new Date(reportDate);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(reportDate);
    endDate.setHours(23, 59, 59, 999);

    // Get kids in this school
    const kidSchools = await DB.KidSchools.findAll({
      where: {
        school_id: schoolId,
      },
      attributes: ['kid_id'],
    });

    const kidIds = kidSchools.map(ks => ks.kid_id);

    // Get orders for these kids on the specified date
    const orders = await DB.Orders.findAll({
      where: {
        kid_id: {
          [Op.in]: kidIds,
        },
        created_at: {
          [Op.between]: [startDate, endDate],
        },
      },
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
      order: [['created_at', 'ASC']],
    });

    // Group orders by hour
    const ordersByHour: Record<number, { count: number; amount: number }> = {};
    for (let i = 0; i < 24; i++) {
      ordersByHour[i] = { count: 0, amount: 0 };
    }

    orders.forEach(order => {
      const hour = new Date(order.created_at).getHours();
      ordersByHour[hour].count += 1;
      ordersByHour[hour].amount += parseFloat(order.total_price.toString());
    });

    // Format hourly data for response
    const hourlyData = Object.entries(ordersByHour).map(([hour, data]) => ({
      hour: parseInt(hour, 10),
      order_count: data.count,
      total_amount: data.amount,
    }));

    // Calculate product sales
    const productSales: Record<string, { count: number; amount: number }> = {};

    orders.forEach(order => {
      order.order_items.forEach(item => {
        const productId = item.product_id;
        const productName = item.product_name;
        const key = `${productId}:${productName}`;

        if (!productSales[key]) {
          productSales[key] = { count: 0, amount: 0 };
        }

        productSales[key].count += item.quantity;
        productSales[key].amount += parseFloat(item.total_price.toString());
      });
    });

    // Format product sales for response
    const productSalesData = Object.entries(productSales)
      .map(([key, data]) => {
        const [id, name] = key.split(':');
        return {
          product_id: id,
          product_name: name,
          quantity_sold: data.count,
          total_amount: data.amount,
        };
      })
      .sort((a, b) => b.quantity_sold - a.quantity_sold);

    return sendSuccess(
      {
        school_id: schoolId,
        school_name: school.name,
        date: reportDate.toISOString().split('T')[0],
        total_orders: orders.length,
        total_amount: orders.reduce(
          (sum, order) => sum + parseFloat(order.total_amount.toString()),
          0,
        ),
        hourly_data: hourlyData,
        product_sales: productSalesData,
        orders: orders.map(order => ({
          id: order.id,
          kid_id: order.kid_id,
          kid_name: order.kid.name,
          time: order.created_at,
          total_amount: order.total_amount,
          items_count: order.order_items.length,
        })),
      },
      'School daily report retrieved successfully',
      { isSingleItem: true },
    );
  } catch (error) {
    throw error;
  }
};

/**
 * Get school monthly report
 * @param {string} schoolId - School ID
 * @param {number} year - Year
 * @param {number} month - Month (1-12)
 * @returns {Promise<any>} Standardized response with monthly report data
 */
export const getSchoolMonthlyReportService = async (
  schoolId: string,
  year?: number,
  month?: number,
): Promise<any> => {
  try {
    const school = await DB.Schools.findByPk(schoolId);
    if (!school) {
      throw new CustomError('School not found', 404);
    }

    // Parse year and month or use current month
    const now = new Date();
    const reportYear = year || now.getFullYear();
    const reportMonth = month || now.getMonth() + 1;

    const startDate = new Date(reportYear, reportMonth - 1, 1);
    const endDate = new Date(reportYear, reportMonth, 0, 23, 59, 59, 999);

    // Get kids in this school
    const kidSchools = await DB.KidSchools.findAll({
      where: {
        school_id: schoolId,
      },
      attributes: ['kid_id'],
    });

    const kidIds = kidSchools.map(ks => ks.kid_id);

    // Get orders for these kids in the specified month
    const orders = await DB.Orders.findAll({
      where: {
        kid_id: {
          [Op.in]: kidIds,
        },
        created_at: {
          [Op.between]: [startDate, endDate],
        },
      },
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
      order: [['created_at', 'ASC']],
    });

    // Group orders by day
    const ordersByDay: Record<number, { count: number; amount: number }> = {};
    const daysInMonth = new Date(reportYear, reportMonth, 0).getDate();

    for (let i = 1; i <= daysInMonth; i++) {
      ordersByDay[i] = { count: 0, amount: 0 };
    }

    orders.forEach(order => {
      const day = new Date(order.created_at).getDate();
      ordersByDay[day].count += 1;
      ordersByDay[day].amount += parseFloat(order.total_amount.toString());
    });

    // Format daily data for response
    const dailyData = Object.entries(ordersByDay).map(([day, data]) => ({
      day: parseInt(day, 10),
      order_count: data.count,
      total_amount: data.amount,
    }));

    // Calculate product group sales
    const productGroupSales: Record<string, { count: number; amount: number }> =
      {};

    orders.forEach(order => {
      order.order_items.forEach(item => {
        const productGroupId = item.product.product_group_id;
        const productGroupName = item.product.product_group.name;
        const key = `${productGroupId}:${productGroupName}`;

        if (!productGroupSales[key]) {
          productGroupSales[key] = { count: 0, amount: 0 };
        }

        productGroupSales[key].count += item.quantity;
        productGroupSales[key].amount += parseFloat(
          item.total_price.toString(),
        );
      });
    });

    // Format product group sales for response
    const productGroupSalesData = Object.entries(productGroupSales)
      .map(([key, data]) => {
        const [id, name] = key.split(':');
        return {
          product_group_id: id,
          product_group_name: name,
          quantity_sold: data.count,
          total_amount: data.amount,
        };
      })
      .sort((a, b) => b.total_amount - a.total_amount);

    // Calculate kid spending
    const kidSpending: Record<string, { count: number; amount: number }> = {};

    orders.forEach(order => {
      const kidId = order.kid_id;
      const kidName = order.kid.name;
      const key = `${kidId}:${kidName}`;

      if (!kidSpending[key]) {
        kidSpending[key] = { count: 0, amount: 0 };
      }

      kidSpending[key].count += 1;
      kidSpending[key].amount += parseFloat(order.total_amount.toString());
    });

    // Format kid spending for response
    const kidSpendingData = Object.entries(kidSpending)
      .map(([key, data]) => {
        const [id, name] = key.split(':');
        return {
          kid_id: id,
          kid_name: name,
          order_count: data.count,
          total_amount: data.amount,
        };
      })
      .sort((a, b) => b.total_amount - a.total_amount);

    return sendSuccess(
      {
        school_id: schoolId,
        school_name: school.name,
        year: reportYear,
        month: reportMonth,
        total_orders: orders.length,
        total_amount: orders.reduce(
          (sum, order) => sum + parseFloat(order.total_amount.toString()),
          0,
        ),
        daily_data: dailyData,
        product_group_sales: productGroupSalesData,
        kid_spending: kidSpendingData,
      },
      'School monthly report retrieved successfully',
      { isSingleItem: true },
    );
  } catch (error) {
    throw error;
  }
};

export default {
  getSchoolDashboardService,
  getSchoolDailyReportService,
  getSchoolMonthlyReportService,
};
