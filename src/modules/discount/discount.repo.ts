import { DB } from '@/database';
import { DiscountCreationAttributes } from '@/database/models/discount.model';
import { Discount } from '@/interfaces';
import { Op, WhereOptions } from 'sequelize';

const discountRepo = {
  findAllDiscounts: async (): Promise<Discount[]> => {
    return await DB.Discounts.findAll({
      order: [
        ['priority', 'DESC'],
        ['created_at', 'DESC'],
      ],
    });
  },

  findActiveDiscounts: async (): Promise<Discount[]> => {
    const now = new Date();
    const today = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, ...

    // Map day of week to column name
    const dayColumns = [
      'sunday_enabled',
      'monday_enabled',
      'tuesday_enabled',
      'wednesday_enabled',
      'thursday_enabled',
      'friday_enabled',
      'saturday_enabled',
    ];

    const currentDayColumn = dayColumns[dayOfWeek];

    const whereConditions: WhereOptions<Discount> = {
      is_active: true,
    };

    // Using raw query conditions to bypass TypeScript type issues with Sequelize
    // We need to use [Op.and] with proper type casting
    const rawConditions = {
      [Op.and]: [
        {
          [Op.or]: [
            { start_date: { [Op.is]: null } },
            { start_date: { [Op.lte]: today } },
          ],
        },
        {
          [Op.or]: [
            { end_date: { [Op.is]: null } },
            { end_date: { [Op.gte]: today } },
          ],
        },
        {
          [Op.or]: [
            { start_time: { [Op.is]: null } },
            { start_time: { [Op.lte]: currentTime } },
          ],
        },
        {
          [Op.or]: [
            { end_time: { [Op.is]: null } },
            { end_time: { [Op.gte]: currentTime } },
          ],
        },
        {
          [Op.or]: [
            { [currentDayColumn]: true },
            { [currentDayColumn]: { [Op.is]: null } },
          ],
        },
      ],
    };

    return await DB.Discounts.findAll({
      where: {
        ...whereConditions,
        ...rawConditions,
      } as any, // Use type assertion to bypass strict type checking
      order: [
        ['priority', 'DESC'],
        ['created_at', 'DESC'],
      ],
    });
  },

  findDiscountById: async (discountId: string): Promise<Discount | null> => {
    return await DB.Discounts.findByPk(discountId);
  },

  findDiscountsByTarget: async (
    targetType: string,
    targetId: string,
  ): Promise<Discount[]> => {
    const now = new Date();
    const today = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, ...

    // Map day of week to column name
    const dayColumns = [
      'sunday_enabled',
      'monday_enabled',
      'tuesday_enabled',
      'wednesday_enabled',
      'thursday_enabled',
      'friday_enabled',
      'saturday_enabled',
    ];

    const currentDayColumn = dayColumns[dayOfWeek];

    const whereConditions: WhereOptions<Discount> = {
      is_active: true,
      target_type: targetType,
    };

    // Using raw query for target_id to handle null values properly
    const targetCondition = {
      target_id: {
        [Op.or]: [targetId, { [Op.is]: null }], // Handle both specific target and null (all targets)
      },
    };

    // Using raw query conditions to bypass TypeScript type issues with Sequelize
    const timeConditions = {
      [Op.and]: [
        {
          [Op.or]: [
            { start_date: { [Op.is]: null } },
            { start_date: { [Op.lte]: today } },
          ],
        },
        {
          [Op.or]: [
            { end_date: { [Op.is]: null } },
            { end_date: { [Op.gte]: today } },
          ],
        },
        {
          [Op.or]: [
            { start_time: { [Op.is]: null } },
            { start_time: { [Op.lte]: currentTime } },
          ],
        },
        {
          [Op.or]: [
            { end_time: { [Op.is]: null } },
            { end_time: { [Op.gte]: currentTime } },
          ],
        },
        {
          [Op.or]: [
            { [currentDayColumn]: true },
            { [currentDayColumn]: { [Op.is]: null } },
          ],
        },
      ],
    };

    return await DB.Discounts.findAll({
      where: {
        ...whereConditions,
        ...targetCondition,
        ...timeConditions,
      } as any, // Use type assertion to bypass strict type checking
      order: [
        ['priority', 'DESC'],
        ['created_at', 'DESC'],
      ],
    });
  },

  createDiscount: async (
    discountData: DiscountCreationAttributes,
  ): Promise<Discount> => {
    return await DB.Discounts.create(discountData);
  },

  updateDiscount: async (
    discountId: string,
    discountData: Partial<Discount>,
  ): Promise<Discount> => {
    const [_, updatedDiscounts] = await DB.Discounts.update(discountData, {
      where: { id: discountId },
      returning: true,
    });

    return updatedDiscounts[0];
  },

  deleteDiscount: async (discountId: string): Promise<number> => {
    return await DB.Discounts.destroy({ where: { id: discountId } });
  },

  checkTargetExists: async (
    targetType: string,
    targetId: string,
  ): Promise<boolean> => {
    let count = 0;

    switch (targetType) {
      case 'product':
        count = await DB.Products.count({ where: { id: targetId } });
        break;
      case 'product_group':
        count = await DB.ProductGroups.count({ where: { id: targetId } });
        break;
      case 'user':
        count = await DB.Users.count({ where: { id: targetId } });
        break;
      case 'kid':
        count = await DB.Kids.count({ where: { id: targetId } });
        break;
      // For 'order' type - might be a future feature, not implemented yet
      default:
        return false;
    }

    return count > 0;
  },

  getApplicableDiscounts: async (
    productId: string,
    productGroupId?: string,
  ): Promise<Discount[]> => {
    const discounts = [];

    // Get product-specific discounts
    const productDiscounts = await DB.Discounts.findAll({
      where: {
        is_active: true,
        target_type: 'product',
        target_id: productId,
      } as any, // Type assertion to bypass strict checking
      order: [['priority', 'DESC']],
    });

    discounts.push(...productDiscounts);

    // Get product group discounts if applicable
    if (productGroupId) {
      const groupDiscounts = await DB.Discounts.findAll({
        where: {
          is_active: true,
          target_type: 'product_group',
          target_id: productGroupId,
        } as any, // Type assertion to bypass strict checking
        order: [['priority', 'DESC']],
      });

      discounts.push(...groupDiscounts);
    }

    // Get global product discounts (where target_id is null)
    const globalDiscounts = await DB.Discounts.findAll({
      where: {
        is_active: true,
        target_type: 'product',
        target_id: { [Op.is]: null }, // Using Op.is for null check
      } as any, // Type assertion to bypass strict checking
      order: [['priority', 'DESC']],
    });

    discounts.push(...globalDiscounts);

    // Sort by priority and return
    return discounts.sort(
      (a, b) =>
        (b.priority || 0) - (a.priority || 0) ||
        (b.discount_value || 0) - (a.discount_value || 0),
    );
  },
};

export default discountRepo;
