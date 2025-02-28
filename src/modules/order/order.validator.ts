import Joi from 'joi';

const options = {
  errors: {
    wrap: {
      label: '',
    },
  },
};

export const validateOrder = (orderData: any) => {
  const schema = Joi.object({
    kid_id: Joi.string().uuid().required().messages({
      'string.guid': 'Kid ID must be in UUID format',
      'any.required': 'Kid ID is required',
    }),
    items: Joi.array()
      .items(
        Joi.object({
          product_id: Joi.string().uuid().required().messages({
            'string.guid': 'Product ID must be in UUID format',
            'any.required': 'Product ID is required',
          }),
          quantity: Joi.number().integer().min(1).required().messages({
            'number.base': 'Quantity must be a number',
            'number.integer': 'Quantity must be an integer',
            'number.min': 'Quantity must be at least 1',
            'any.required': 'Quantity is required',
          }),
        }),
      )
      .min(1)
      .required()
      .messages({
        'array.min': 'Order must have at least one item',
        'any.required': 'Order items are required',
      }),
  });

  return schema.validate(orderData, options);
};

export const validateOrderItem = (orderItemData: any) => {
  const schema = Joi.object({
    order_id: Joi.string().uuid().required().messages({
      'string.guid': 'Order ID must be in UUID format',
      'any.required': 'Order ID is required',
    }),
    product_id: Joi.string().uuid().required().messages({
      'string.guid': 'Product ID must be in UUID format',
      'any.required': 'Product ID is required',
    }),
    product_name: Joi.string().required().messages({
      'any.required': 'Product name is required',
    }),
    quantity: Joi.number().integer().min(1).required().messages({
      'number.base': 'Quantity must be a number',
      'number.integer': 'Quantity must be an integer',
      'number.min': 'Quantity must be at least 1',
      'any.required': 'Quantity is required',
    }),
    unit_price: Joi.number().min(0).required().messages({
      'number.base': 'Unit price must be a number',
      'number.min': 'Unit price must be a non-negative number',
      'any.required': 'Unit price is required',
    }),
    total_price: Joi.number().min(0).required().messages({
      'number.base': 'Total price must be a number',
      'number.min': 'Total price must be a non-negative number',
      'any.required': 'Total price is required',
    }),
    discount_applied: Joi.number().min(0).optional().messages({
      'number.base': 'Discount applied must be a number',
      'number.min': 'Discount applied must be a non-negative number',
    }),
  });

  return schema.validate(orderItemData, options);
};
