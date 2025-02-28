import Joi from 'joi';
import { Kid } from '@/interfaces';

const options = {
  errors: {
    wrap: {
      label: '',
    },
  },
};

export const validateKid = (kidData: Partial<Kid>, isUpdate = false) => {
  const schema = Joi.object({
    id: Joi.string().uuid().optional().messages({
      'string.guid': 'Kid ID must be in UUID format',
    }),
    name: isUpdate
      ? Joi.string().min(1).optional().messages({
          'string.min': 'Name should be at least 1 character',
        })
      : Joi.string().min(1).required().messages({
          'string.min': 'Name should be at least 1 character',
          'any.required': 'Name is required',
        }),
    parent_id: isUpdate
      ? Joi.string().uuid().optional().messages({
          'string.guid': 'Parent ID must be in UUID format',
        })
      : Joi.string().uuid().required().messages({
          'string.guid': 'Parent ID must be in UUID format',
          'any.required': 'Parent ID is required',
        }),
    rfid_token: Joi.array().items(Joi.string().min(1)).optional().messages({
      'array.base': 'RFID tokens must be an array',
      'string.min': 'RFID token should not be empty',
    }),
    monthly_spending_limit: Joi.number().min(0).optional().messages({
      'number.min': 'Monthly spending limit must be a positive number',
    }),
    is_active: Joi.boolean().optional(),
    created_at: Joi.date().optional(),
    updated_at: Joi.date().optional(),
  });

  return schema.validate(kidData, options);
};
