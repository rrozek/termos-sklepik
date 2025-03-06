import Joi from 'joi';
import { School } from '@/interfaces';

const options = {
  errors: {
    wrap: {
      label: '',
    },
  },
};

const timePattern = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;

export const validateSchool = (
  schoolData: Partial<School>,
  isUpdate = false,
) => {
  const schema = Joi.object({
    id: Joi.string().uuid().optional().messages({
      'string.guid': 'School ID must be in UUID format',
    }),
    name: isUpdate
      ? Joi.string().min(1).optional().messages({
          'string.min': 'Name should be at least 1 character',
        })
      : Joi.string().min(1).required().messages({
          'string.min': 'Name should be at least 1 character',
          'any.required': 'Name is required',
        }),
    address: Joi.string().optional().allow('', null),
    city: Joi.string().optional().allow('', null),
    postal_code: Joi.string().optional().allow('', null),
    contact_email: Joi.string().email().optional().allow('', null).messages({
      'string.email': 'Contact email must be a valid email address',
    }),
    contact_phone: Joi.string().optional().allow('', null),
    opening_hour: Joi.string()
      .pattern(timePattern)
      .optional()
      .allow('', null)
      .messages({
        'string.pattern.base': 'Opening hour must be in HH:MM format (24-hour)',
      }),
    closing_hour: Joi.string()
      .pattern(timePattern)
      .optional()
      .allow('', null)
      .messages({
        'string.pattern.base': 'Closing hour must be in HH:MM format (24-hour)',
      }),
    monday_enabled: Joi.boolean().optional(),
    tuesday_enabled: Joi.boolean().optional(),
    wednesday_enabled: Joi.boolean().optional(),
    thursday_enabled: Joi.boolean().optional(),
    friday_enabled: Joi.boolean().optional(),
    saturday_enabled: Joi.boolean().optional(),
    sunday_enabled: Joi.boolean().optional(),
    is_active: Joi.boolean().optional(),
    created_at: Joi.date().optional(),
    updated_at: Joi.date().optional(),
  });

  return schema.validate(schoolData, options);
};

export const validateKidSchoolAssociation = (data: any) => {
  const schema = Joi.object({
    kid_id: Joi.string().uuid().required().messages({
      'string.guid': 'Kid ID must be in UUID format',
      'any.required': 'Kid ID is required',
    }),
    school_id: Joi.string().uuid().required().messages({
      'string.guid': 'School ID must be in UUID format',
      'any.required': 'School ID is required',
    }),
  });

  return schema.validate(data, options);
};
