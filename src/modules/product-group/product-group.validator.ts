import Joi from 'joi';
import { ProductGroup } from '@/interfaces';

const options = {
  errors: {
    wrap: {
      label: '',
    },
  },
};

export const validateProductGroup = (
  productGroupData: Partial<ProductGroup>,
  isUpdate = false,
) => {
  const schema = Joi.object({
    id: Joi.string().uuid().optional().messages({
      'string.guid': 'Product group ID must be in UUID format',
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
    is_active: Joi.boolean().optional(),
    created_at: Joi.date().optional(),
    updated_at: Joi.date().optional(),
  });

  return schema.validate(productGroupData, options);
};
