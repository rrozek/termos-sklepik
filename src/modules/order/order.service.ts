// modules/order/order.service.ts

import { Order, OrderItem, UserRole } from '@/interfaces';
import { validateOrder } from './order.validator';
import orderRepo from './order.repo';
import discountRepo from '../discount/discount.repo';
import kidRepo from '../kid/kid.repo';
import kidMonthlySpendingRepo from '../kid/kid-monthly-spending.repo';
import { CustomError } from '@/utils/custom-error';
import { sendSuccess, sendError } from '@/middlewares/response.middleware';
import { DiscountType } from '@/database/models/discount.model';
import notificationService from '@/utils/notification.service';
import userRepo from '../user/user.repo';
import productRepo from '../product/product.repo';

/**
 * Get all orders with filtering and pagination (admin only)
 * @param {Object} queryParams - Query parameters for filtering and pagination
 * @returns {Promise<Object>} Standardized response with orders data
 */
export const getAllOrdersService = async (
  queryParams: any = {},
): Promise<any> => {
  try {
    const result = await orderRepo.findAllOrders(queryParams);
    return sendSuccess(result.data, 'Orders retrieved successfully', {
      page: result.page,
      limit: result.limit,
      totalItems: result.totalItems,
      totalPages: result.totalPages,
      hasNextPage: result.hasNextPage,
      hasPrevPage: result.hasPrevPage,
    });
  } catch (error) {
    throw error;
  }
};

/**
 * Get orders for authenticated parent with filtering and pagination
 * @param {string} parentId - Parent ID
 * @param {Object} queryParams - Query parameters for filtering and pagination
 * @returns {Promise<Object>} Standardized response with orders data
 */
export const getParentOrdersService = async (
  parentId: string,
  queryParams: any = {},
): Promise<any> => {
  if (!parentId) {
    throw new CustomError('Parent ID is required', 400);
  }

  try {
    // Check if user is admin
    const user = await userRepo.getUserProfile(parentId);

    // Admin can see all orders
    if (user?.role === UserRole.ADMIN) {
      return await getAllOrdersService(queryParams);
    }

    const result = await orderRepo.findOrdersByParentId(parentId, queryParams);
    return sendSuccess(result.data, 'Orders retrieved successfully', {
      page: result.page,
      limit: result.limit,
      totalItems: result.totalItems,
      totalPages: result.totalPages,
      hasNextPage: result.hasNextPage,
      hasPrevPage: result.hasPrevPage,
    });
  } catch (error) {
    throw error;
  }
};

/**
 * Get orders for a specific kid with filtering and pagination
 * @param {string} kidId - Kid ID
 * @param {string} parentId - Parent ID
 * @param {Object} queryParams - Query parameters for filtering and pagination
 * @returns {Promise<Object>} Standardized response with orders data
 */
export const getKidOrdersService = async (
  kidId: string,
  parentId: string,
  queryParams: any = {},
): Promise<any> => {
  if (!kidId) {
    throw new CustomError('Kid ID is required', 400);
  }

  if (!parentId) {
    throw new CustomError('Parent ID is required', 400);
  }

  try {
    // Check if kid exists
    const kid = await kidRepo.findById(kidId);
    if (!kid) {
      throw new CustomError('Kid not found', 404);
    }

    // Check if kid belongs to parent or user is admin
    const user = await userRepo.findByPk(parentId);
    if (
      user?.role !== UserRole.ADMIN &&
      user?.role !== UserRole.STAFF &&
      kid.parent_id !== parentId
    ) {
      throw new CustomError(
        'Access denied: Kid does not belong to this parent',
        403,
      );
    }

    const result = await orderRepo.findOrdersByKidId(kidId, queryParams);
    return sendSuccess(result.data, 'Orders retrieved successfully', {
      page: result.page,
      limit: result.limit,
      totalItems: result.totalItems,
      totalPages: result.totalPages,
      hasNextPage: result.hasNextPage,
      hasPrevPage: result.hasPrevPage,
    });
  } catch (error) {
    throw error;
  }
};

/**
 * Get an order by ID
 * @param {string} orderId - Order ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Standardized response with order data
 */
export const getOrderByIdService = async (
  orderId: string,
  userId: string,
): Promise<any> => {
  if (!orderId) {
    throw new CustomError('Order ID is required', 400);
  }

  try {
    const include = [
      {
        association: 'kid',
        attributes: ['id', 'name'],
      },
      {
        association: 'parent',
        attributes: ['id', 'name', 'email'],
      },
      {
        association: 'order_items',
        include: [
          {
            association: 'product',
            attributes: ['id', 'name', 'image_url'],
          },
        ],
      },
    ];

    const order = await orderRepo.findById(orderId, include);

    if (!order) {
      throw new CustomError('Order not found', 404);
    }

    // Check if user has permission to view this order
    const user = await userRepo.findByPk(userId);

    if (
      user?.role !== UserRole.ADMIN &&
      user?.role !== UserRole.STAFF &&
      order.parent_id !== userId
    ) {
      throw new CustomError(
        'Access denied: Order does not belong to this user',
        403,
      );
    }

    return sendSuccess(order, 'Order retrieved successfully', {
      isSingleItem: true,
    });
  } catch (error) {
    throw error;
  }
};

/**
 * Get order statistics
 * @param {string} parentId - Parent ID
 * @param {string} kidId - Kid ID (optional)
 * @param {string} startDate - Start date (optional)
 * @param {string} endDate - End date (optional)
 * @returns {Promise<Object>} Standardized response with order statistics
 */
export const getOrderStatisticsService = async (
  parentId?: string,
  kidId?: string,
  startDate?: string,
  endDate?: string,
): Promise<any> => {
  try {
    // If kidId is provided, check if it belongs to the parent
    if (kidId && parentId) {
      const kid = await kidRepo.findById(kidId);
      if (!kid) {
        throw new CustomError('Kid not found', 404);
      }

      const user = await userRepo.findByPk(parentId);
      if (
        user?.role !== UserRole.ADMIN &&
        user?.role !== UserRole.STAFF &&
        kid.parent_id !== parentId
      ) {
        throw new CustomError(
          'Access denied: Kid does not belong to this parent',
          403,
        );
      }
    }

    const statistics = await orderRepo.getOrderStatistics(
      parentId,
      kidId,
      startDate,
      endDate,
    );
    return sendSuccess(statistics, 'Order statistics retrieved successfully', {
      isSingleItem: true,
    });
  } catch (error) {
    throw error;
  }
};

/**
 * Check if a kid can place an order based on their monthly spending limit
 * @param {string} kidId - Kid ID
 * @param {number} orderAmount - Order amount
 * @returns {Promise<boolean>} Whether the order can be placed
 */
export const checkMonthlySpendingLimit = async (
  kidId: string,
  orderAmount: number,
): Promise<{ canOrder: boolean; remainingBudget: number }> => {
  try {
    const kid = await kidRepo.findById(kidId);
    if (!kid) {
      throw new CustomError('Kid not found', 404);
    }

    // If no spending limit is set, allow the order
    if (!kid.monthly_spending_limit) {
      return { canOrder: true, remainingBudget: -1 }; // -1 indicates no limit
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
    const spendingLimit = parseFloat(kid.monthly_spending_limit.toString());
    const remainingBudget = spendingLimit - currentSpending;

    // Check if the order would exceed the limit
    return {
      canOrder: currentSpending + orderAmount <= spendingLimit,
      remainingBudget,
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Update a kid's monthly spending
 * @param {string} kidId - Kid ID
 * @param {number} amount - Amount to add to current spending
 * @returns {Promise<void>}
 */
export const updateKidMonthlySpending = async (
  kidId: string,
  amount: number,
): Promise<void> => {
  try {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1; // JavaScript months are 0-indexed

    await kidMonthlySpendingRepo.updateKidMonthlySpending(
      kidId,
      year,
      month,
      amount,
    );
  } catch (error) {
    throw error;
  }
};

/**
 * Check if a kid can place an order based on school time restrictions
 * @param {string} kidId - Kid ID
 * @returns {Promise<boolean>} Whether the order can be placed
 */
export const checkTimeRestrictions = async (
  kidId: string,
): Promise<boolean> => {
  try {
    // Get kid's school
    const kid = await kidRepo.findKidWithSchools(kidId);

    // @ts-expect-error - schools property exists through the include
    if (!kid?.schools?.length) {
      return true; // No school restrictions
    }

    // @ts-expect-error - schools property exists through the include
    const school = kid.schools[0];
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.

    // Check if store is open on this day
    const dayFields = [
      'sunday_enabled',
      'monday_enabled',
      'tuesday_enabled',
      'wednesday_enabled',
      'thursday_enabled',
      'friday_enabled',
      'saturday_enabled',
    ];

    if (!school[dayFields[dayOfWeek]]) {
      return false;
    }

    // Check opening hours
    if (school.opening_hour && school.closing_hour) {
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentTime = `${String(currentHour).padStart(2, '0')}:${String(
        currentMinute,
      ).padStart(2, '0')}`;

      if (
        currentTime < school.opening_hour ||
        currentTime > school.closing_hour
      ) {
        return false;
      }
    }

    return true;
  } catch (error) {
    throw error;
  }
};

/**
 * Create a new order
 * @param {any} orderData - Order data
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Standardized response with created order data
 */
export const createOrderService = async (
  orderData: any,
  userId: string,
): Promise<any> => {
  try {
    // Validate order data
    const { error } = validateOrder(orderData);
    if (error) {
      throw new CustomError(error.details[0].message, 400);
    }

    // Check if kid exists and belongs to parent (unless admin/staff)
    const kid = await kidRepo.findById(orderData.kid_id);
    if (!kid) {
      throw new CustomError('Kid not found', 404);
    }

    const user = await userRepo.findByPk(userId);
    if (
      user?.role !== UserRole.ADMIN &&
      user?.role !== UserRole.STAFF &&
      kid.parent_id !== userId
    ) {
      throw new CustomError(
        'Access denied: Kid does not belong to this parent',
        403,
      );
    }

    // Check time restrictions
    const canOrderNow = await checkTimeRestrictions(kid.id);
    if (!canOrderNow) {
      throw new CustomError(
        'Orders are not allowed at this time for this school',
        403,
      );
    }

    // Set parent ID from authenticated user or from kid's parent
    const parentId =
      user?.role === UserRole.ADMIN || user?.role === UserRole.STAFF
        ? kid.parent_id
        : userId;

    // Set initial total
    let totalAmount = 0;

    try {
      // Process order items to calculate total amount first
      for (const item of orderData.items) {
        // Fetch product
        const product = await productRepo.findByPk(item.product_id);
        if (!product) {
          throw new CustomError(
            `Product not found with ID: ${item.product_id}`,
            404,
          );
        }

        if (!product.is_active) {
          throw new CustomError(`Product is not active: ${product.name}`, 400);
        }

        // Calculate item price
        const quantity = parseInt(item.quantity, 10);
        if (isNaN(quantity) || quantity <= 0) {
          throw new CustomError('Quantity must be a positive number', 400);
        }

        const unitPrice = product.price;
        const totalPrice = unitPrice * quantity;
        let discountAmount = 0;

        // Check for applicable discounts
        const applicableDiscounts = await discountRepo.getApplicableDiscounts(
          product.id,
          product.product_group_id,
        );

        if (applicableDiscounts.length > 0) {
          // Apply the highest priority discount
          const discount = applicableDiscounts[0];

          switch (discount.discount_type) {
            case DiscountType.PERCENTAGE:
              discountAmount = (totalPrice * discount.discount_value) / 100;
              break;
            case DiscountType.FIXED_AMOUNT:
              discountAmount = discount.discount_value;
              break;
            case DiscountType.BUY_X_GET_Y:
              if (
                discount.buy_quantity &&
                discount.get_quantity &&
                quantity >= discount.buy_quantity
              ) {
                const numFreeItems =
                  Math.floor(quantity / discount.buy_quantity) *
                  discount.get_quantity;
                discountAmount = numFreeItems * unitPrice;
              }
              break;
            // Bundle discounts would require more complex logic based on multiple items
          }

          // Ensure discount doesn't exceed the total price
          discountAmount = Math.min(discountAmount, totalPrice);
        }

        // Final price after discount
        const finalPrice = totalPrice - discountAmount;
        totalAmount += finalPrice;
      }

      // Check monthly spending limit
      const { canOrder, remainingBudget } = await checkMonthlySpendingLimit(
        kid.id,
        totalAmount,
      );

      if (!canOrder) {
        throw new CustomError(
          `Order exceeds monthly spending limit. Remaining budget: ${remainingBudget}`,
          403,
        );
      }

      // Create the order
      const order = await orderRepo.create({
        kid_id: orderData.kid_id,
        parent_id: parentId,
        total_amount: totalAmount,
        status: orderData.status || 'pending',
      });

      // Process order items again to create them
      const orderItems: OrderItem[] = [];

      for (const item of orderData.items) {
        // Fetch product
        const product = await productRepo.findByPk(item.product_id);

        if (!product) {
          throw new CustomError(
            `Product not found with ID: ${item.product_id}`,
            404,
          );
        }

        // Calculate item price
        const quantity = parseInt(item.quantity, 10);
        const unitPrice = product.price;
        const totalPrice = unitPrice * quantity;
        let discountAmount = 0;

        // Check for applicable discounts
        const applicableDiscounts = await discountRepo.getApplicableDiscounts(
          product.id,
          product.product_group_id,
        );

        if (applicableDiscounts.length > 0) {
          // Apply the highest priority discount
          const discount = applicableDiscounts[0];

          switch (discount.discount_type) {
            case DiscountType.PERCENTAGE:
              discountAmount = (totalPrice * discount.discount_value) / 100;
              break;
            case DiscountType.FIXED_AMOUNT:
              discountAmount = discount.discount_value;
              break;
            case DiscountType.BUY_X_GET_Y:
              if (
                discount.buy_quantity &&
                discount.get_quantity &&
                quantity >= discount.buy_quantity
              ) {
                const numFreeItems =
                  Math.floor(quantity / discount.buy_quantity) *
                  discount.get_quantity;
                discountAmount = numFreeItems * unitPrice;
              }
              break;
          }

          // Ensure discount doesn't exceed the total price
          discountAmount = Math.min(discountAmount, totalPrice);
        }

        // Final price after discount
        const finalPrice = totalPrice - discountAmount;

        // Create order item
        const orderItem = await orderRepo.createOrderItem({
          order_id: order.id,
          product_id: product.id,
          product_name: product.name,
          quantity,
          unit_price: unitPrice,
          total_price: finalPrice,
          discount_applied: discountAmount > 0 ? discountAmount : undefined,
        });

        orderItems.push(orderItem);
      }

      // Update kid's monthly spending
      await updateKidMonthlySpending(kid.id, totalAmount);

      // Send notification to parent
      if (remainingBudget !== -1 && kid.monthly_spending_limit) {
        // Only send if there's a spending limit
        await notificationService.sendOrderPlacedNotification(
          kid.parent_id,
          kid.id,
          totalAmount,
          remainingBudget - totalAmount,
        );

        // Check if remaining budget is low (less than 20% of limit)
        const spendingLimit = parseFloat(kid.monthly_spending_limit.toString());
        const newRemainingBudget = remainingBudget - totalAmount;
        if (newRemainingBudget < spendingLimit * 0.2) {
          await notificationService.sendLowBalanceNotification(
            kid.parent_id,
            kid.id,
            newRemainingBudget,
          );
        }

        // Check if limit is reached
        if (newRemainingBudget <= 0) {
          await notificationService.sendLimitReachedNotification(
            kid.parent_id,
            kid.id,
            spendingLimit,
          );
        }
      }

      // Fetch complete order with items
      const createdOrder = await orderRepo.findById(order.id, [
        {
          association: 'kid',
          attributes: ['id', 'name'],
        },
        {
          association: 'order_items',
          include: [
            {
              association: 'product',
              attributes: ['id', 'name', 'image_url'],
            },
          ],
        },
      ]);

      if (!createdOrder) {
        throw new CustomError('Order not found after creation', 404);
      }

      return sendSuccess(createdOrder, 'Order created successfully', {
        isSingleItem: true,
      });
    } catch (error) {
      throw error;
    }
  } catch (error) {
    throw error;
  }
};

/**
 * Update order status
 * @param {string} orderId - Order ID
 * @param {string} status - New order status
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Standardized response with updated order data
 */
export const updateOrderStatusService = async (
  orderId: string,
  status: string,
  userId: string,
): Promise<any> => {
  try {
    // Check if order exists and user has permission to update it
    const orderResponse = await getOrderByIdService(orderId, userId);

    if (!orderResponse || !orderResponse.data) {
      throw new CustomError('Order not found', 404);
    }

    // Validate status
    const validStatuses = ['pending', 'completed', 'canceled'];
    if (!validStatuses.includes(status)) {
      throw new CustomError(
        `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
        400,
      );
    }

    // Update order status
    await orderRepo.update(orderId, { status });

    // Get updated order
    const include = [
      {
        association: 'kid',
        attributes: ['id', 'name'],
      },
      {
        association: 'order_items',
        include: [
          {
            association: 'product',
            attributes: ['id', 'name', 'image_url'],
          },
        ],
      },
    ];

    const updatedOrder = await orderRepo.findById(orderId, include);

    return sendSuccess(updatedOrder, 'Order status updated successfully', {
      isSingleItem: true,
    });
  } catch (error) {
    throw error;
  }
};

/**
 * Cancel an order
 * @param {string} orderId - Order ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Standardized response with canceled order data
 */
export const cancelOrderService = async (
  orderId: string,
  userId: string,
): Promise<any> => {
  // Simply call updateOrderStatusService with 'canceled' status
  return await updateOrderStatusService(orderId, 'canceled', userId);
};
