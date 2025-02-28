import Joi from 'joi';
import { Discount } from '@/interfaces';

const options = {
  errors: {
    wrap: {
      label: '',
    },
  },
};

export const validateDiscount = (
  discountData: Partial<Discount>,
  isUpdate = false,
) => {
  const timePattern = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;

  const schema = Joi.object({
    id: Joi.string().uuid().optional().messages({
      'string.guid': 'Discount ID must be in UUID format',
    }),
    name: isUpdate
      ? Joi.string().min(1).optional().messages({
          'string.min': 'Name should be at least 1 character',
        })
      : Joi.string().min(1).required().messages({
          'string.min': 'Name should be at least 1 character',
          'any.required': 'Name is required',
        }),
    description: Joi.string().optional().allow('', null),
    discount_type: isUpdate
      ? Joi.string()
          .valid('percentage', 'fixed_amount', 'buy_x_get_y', 'bundle')
          .optional()
          .messages({
            'any.only':
              'Discount type must be one of: percentage, fixed_amount, buy_x_get_y, bundle',
          })
      : Joi.string()
          .valid('percentage', 'fixed_amount', 'buy_x_get_y', 'bundle')
          .required()
          .messages({
            'any.only':
              'Discount type must be one of: percentage, fixed_amount, buy_x_get_y, bundle',
            'any.required': 'Discount type is required',
          }),
    discount_value: isUpdate
      ? Joi.number().min(0).optional().messages({
          'number.min': 'Discount value must be a non-negative number',
        })
      : Joi.number().min(0).required().messages({
          'number.min': 'Discount value must be a non-negative number',
          'any.required': 'Discount value is required',
        }),
    target_type: isUpdate
      ? Joi.string()
          .valid('product', 'product_group', 'order', 'user', 'kid')
          .optional()
          .messages({
            'any.only':
              'Target type must be one of: product, product_group, order, user, kid',
          })
      : Joi.string()
          .valid('product', 'product_group', 'order', 'user', 'kid')
          .required()
          .messages({
            'any.only':
              'Target type must be one of: product, product_group, order, user, kid',
            'any.required': 'Target type is required',
          }),
    target_id: Joi.string().uuid().optional().allow(null).messages({
      'string.guid': 'Target ID must be in UUID format',
    }),

    // Time-based restrictions
    start_date: Joi.date().optional().allow(null),
    end_date: Joi.date().optional().allow(null),
    start_time: Joi.string()
      .pattern(timePattern)
      .optional()
      .allow('', null)
      .messages({
        'string.pattern.base': 'Start time must be in HH:MM format (24-hour)',
      }),
    end_time: Joi.string()
      .pattern(timePattern)
      .optional()
      .allow('', null)
      .messages({
        'string.pattern.base': 'End time must be in HH:MM format (24-hour)',
      }),

    // Day-based restrictions
    monday_enabled: Joi.boolean().optional(),
    tuesday_enabled: Joi.boolean().optional(),
    wednesday_enabled: Joi.boolean().optional(),
    thursday_enabled: Joi.boolean().optional(),
    friday_enabled: Joi.boolean().optional(),
    saturday_enabled: Joi.boolean().optional(),
    sunday_enabled: Joi.boolean().optional(),

    // Special conditions
    minimum_purchase_amount: Joi.number()
      .min(0)
      .optional()
      .allow(null)
      .messages({
        'number.min': 'Minimum purchase amount must be a non-negative number',
      }),
    minimum_quantity: Joi.number()
      .integer()
      .min(0)
      .optional()
      .allow(null)
      .messages({
        'number.min': 'Minimum quantity must be a non-negative integer',
        'number.integer': 'Minimum quantity must be an integer',
      }),
    buy_quantity: Joi.number()
      .integer()
      .min(1)
      .optional()
      .allow(null)
      .messages({
        'number.min': 'Buy quantity must be at least 1',
        'number.integer': 'Buy quantity must be an integer',
      }),
    get_quantity: Joi.number()
      .integer()
      .min(1)
      .optional()
      .allow(null)
      .messages({
        'number.min': 'Get quantity must be at least 1',
        'number.integer': 'Get quantity must be an integer',
      }),
    is_stackable: Joi.boolean().optional(),
    priority: Joi.number().integer().min(0).optional().messages({
      'number.min': 'Priority must be a non-negative integer',
      'number.integer': 'Priority must be an integer',
    }),
    is_active: Joi.boolean().optional(),
    created_at: Joi.date().optional(),
    updated_at: Joi.date().optional(),
  });

  return schema.validate(discountData, options);
};
