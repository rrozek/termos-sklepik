import Joi from 'joi';
import { Product } from '@/interfaces';

const options = {
  errors: {
    wrap: {
      label: '',
    },
  },
};

export const validateProduct = (
  productData: Partial<Product>,
  isUpdate = false,
) => {
  const schema = Joi.object({
    id: Joi.string().uuid().optional().messages({
      'string.guid': 'Product ID must be in UUID format',
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
    ingredients: Joi.string().optional().allow('', null),
    barcode: Joi.string().optional().allow('', null),
    image_url: Joi.string().uri().optional().allow('', null).messages({
      'string.uri': 'Image URL must be a valid URL',
    }),
    price: isUpdate
      ? Joi.number().min(0).optional().messages({
          'number.min': 'Price must be a non-negative number',
        })
      : Joi.number().min(0).required().messages({
          'number.min': 'Price must be a non-negative number',
          'any.required': 'Price is required',
        }),
    product_group_id: Joi.string().uuid().optional().allow(null).messages({
      'string.guid': 'Product group ID must be in UUID format',
    }),
    is_active: Joi.boolean().optional(),
    created_at: Joi.date().optional(),
    updated_at: Joi.date().optional(),
  });

  return schema.validate(productData, options);
};
