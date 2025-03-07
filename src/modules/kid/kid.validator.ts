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
    // Virtual fields - not persisted to the DB directly
    schools: Joi.array().optional(),
    parent: Joi.object().optional(),
  });

  return schema.validate(kidData, options);
};

export const validateKidWithSchools = (data: any, isUpdate = false) => {
  const kidSchema = validateKid(data, isUpdate);

  const schoolIdsSchema = Joi.object({
    schoolIds: Joi.array()
      .items(
        Joi.string().uuid().messages({
          'string.guid': 'School ID must be in UUID format',
        }),
      )
      .optional(),
  });

  const { error: schoolError } = schoolIdsSchema.validate(
    { schoolIds: data.schoolIds },
    options,
  );

  if (kidSchema.error) return kidSchema;
  if (schoolError) return { error: schoolError };

  return { value: data };
};
