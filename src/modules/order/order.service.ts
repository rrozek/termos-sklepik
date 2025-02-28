import { Order, OrderItem } from '@/interfaces';
import { validateOrder } from './order.validator';
import orderRepo from './order.repo';
import discountRepo from '../discount/discount.repo';
import { CustomError } from '@/utils/custom-error';
import { UserRole } from '@/interfaces';
import { DB } from '@/database';
import { DiscountType } from '@database/models/discount.model';

interface OrderFilters {
  page: number;
  limit: number;
  startDate?: string;
  endDate?: string;
}

export const getAllOrdersService = async (
  filters: OrderFilters,
): Promise<{ orders: Order[]; total: number }> => {
  return await orderRepo.findAllOrders(filters);
};

export const getParentOrdersService = async (
  parentId: string,
  filters: OrderFilters,
): Promise<{ orders: Order[]; total: number }> => {
  if (!parentId) {
    throw new CustomError('Parent ID is required', 400);
  }

  const user = await DB.Users.findByPk(parentId);

  // Admin can see all orders
  if (user?.role === UserRole.ADMIN) {
    return await orderRepo.findAllOrders(filters);
  }

  return await orderRepo.findOrdersByParentId(parentId, filters);
};

export const getKidOrdersService = async (
  kidId: string,
  parentId: string,
  filters: OrderFilters,
): Promise<{ orders: Order[]; total: number }> => {
  if (!kidId) {
    throw new CustomError('Kid ID is required', 400);
  }

  if (!parentId) {
    throw new CustomError('Parent ID is required', 400);
  }

  // Check if kid exists
  const kid = await DB.Kids.findByPk(kidId);
  if (!kid) {
    throw new CustomError('Kid not found', 404);
  }

  // Check if kid belongs to parent or user is admin
  const user = await DB.Users.findByPk(parentId);
  if (user?.role !== UserRole.ADMIN && kid.parent_id !== parentId) {
    throw new CustomError(
      'Access denied: Kid does not belong to this parent',
      403,
    );
  }

  return await orderRepo.findOrdersByKidId(kidId, filters);
};

export const getOrderByIdService = async (
  orderId: string,
  userId: string,
): Promise<Order> => {
  if (!orderId) {
    throw new CustomError('Order ID is required', 400);
  }

  const order = await orderRepo.findOrderById(orderId);

  if (!order) {
    throw new CustomError('Order not found', 404);
  }

  // Check if user has permission to view this order
  const user = await DB.Users.findByPk(userId);

  if (user?.role !== UserRole.ADMIN && order.parent_id !== userId) {
    throw new CustomError(
      'Access denied: Order does not belong to this user',
      403,
    );
  }

  return order;
};

export const createOrderService = async (
  orderData: any,
  userId: string,
): Promise<Order> => {
  // Validate order data
  const { error } = validateOrder(orderData);
  if (error) {
    throw new CustomError(error.details[0].message, 400);
  }

  // Check if kid exists and belongs to parent (unless admin)
  const kid = await DB.Kids.findByPk(orderData.kid_id);
  if (!kid) {
    throw new CustomError('Kid not found', 404);
  }

  const user = await DB.Users.findByPk(userId);
  if (user?.role !== UserRole.ADMIN && kid.parent_id !== userId) {
    throw new CustomError(
      'Access denied: Kid does not belong to this parent',
      403,
    );
  }

  // Set parent ID from authenticated user or from kid's parent
  const parentId = user?.role === UserRole.ADMIN ? kid.parent_id : userId;

  // Set initial total
  let totalAmount = 0;

  // Start transaction
  const transaction = await DB.sequelize.transaction();

  try {
    // Create the order
    const order = await orderRepo.createOrder(
      {
        kid_id: orderData.kid_id,
        parent_id: parentId,
        total_amount: 0, // Will update after calculating items
      },
      transaction,
    );

    // Process order items
    const orderItems: OrderItem[] = [];

    for (const item of orderData.items) {
      // Fetch product
      const product = await DB.Products.findByPk(item.product_id);
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
      let totalPrice = unitPrice * quantity;
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

      // Create order item
      const orderItem = await orderRepo.createOrderItem(
        {
          order_id: order.id,
          product_id: product.id,
          product_name: product.name,
          quantity,
          unit_price: unitPrice,
          total_price: finalPrice,
          discount_applied: discountAmount > 0 ? discountAmount : undefined,
        },
        transaction,
      );

      orderItems.push(orderItem);
      totalAmount += finalPrice;
    }

    // Update order with final total
    await orderRepo.updateOrder(
      order.id,
      { total_amount: totalAmount },
      transaction,
    );

    // Commit transaction
    await transaction.commit();

    // Fetch complete order with items
    const createdOrder = await orderRepo.findOrderById(order.id);
    if (!createdOrder) {
      throw new CustomError('Order not found after creation', 404);
    }
    return createdOrder;
  } catch (error) {
    // Rollback transaction on error
    await transaction.rollback();
    throw error;
  }
};
