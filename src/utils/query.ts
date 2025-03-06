// utils/query.ts

import { Op } from 'sequelize';

/**
 * Build pagination parameters from request query
 * @param {Object} query - Request query object
 * @returns {Object} Pagination parameters
 */
export const getPaginationParams = (query: any) => {
  const page = parseInt(query.page?.toString() || '1', 10);
  const limit = parseInt(query.limit?.toString() || '10', 10);
  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

/**
 * Build a filter object for Sequelize queries based on request query parameters
 * @param {Object} query - Request query object
 * @param {Object} filterMapping - Mapping of query params to database fields
 * @returns {Object} Sequelize filter object
 */
export const buildFilterQuery = (
  query: any,
  filterMapping: Record<string, string> = {},
) => {
  const filter: Record<string, any> = {};

  // Process each query parameter
  Object.keys(query).forEach(param => {
    // Skip pagination parameters
    if (['page', 'limit', 'sort', 'order'].includes(param)) {
      return;
    }

    // Get the database field name (use the param name if not mapped)
    const fieldName = filterMapping[param] || param;

    // Handle special query parameters
    if (param.endsWith('_gte')) {
      const field = fieldName.replace('_gte', '');
      filter[field] = filter[field] || {};
      filter[field][Op.gte] = parseNumericIfPossible(query[param]);
    } else if (param.endsWith('_lte')) {
      const field = fieldName.replace('_lte', '');
      filter[field] = filter[field] || {};
      filter[field][Op.lte] = parseNumericIfPossible(query[param]);
    } else if (param.endsWith('_ne')) {
      const field = fieldName.replace('_ne', '');
      filter[field] = { [Op.ne]: parseNumericIfPossible(query[param]) };
    } else if (param.endsWith('_like')) {
      const field = fieldName.replace('_like', '');
      filter[field] = { [Op.iLike]: `%${query[param]}%` };
    } else if (param.endsWith('_in')) {
      const field = fieldName.replace('_in', '');
      const values = (query[param] as string)
        .split(',')
        .map(v => parseNumericIfPossible(v.trim()));
      filter[field] = { [Op.in]: values };
    } else if (param.endsWith('_null')) {
      const field = fieldName.replace('_null', '');
      const isNull = query[param] === 'true';
      filter[field] = isNull ? { [Op.is]: null } : { [Op.not]: null };
    }
    // Handle regular fields (exact match)
    else if (!param.includes('_') && query[param] !== '') {
      filter[fieldName] = parseNumericIfPossible(query[param]);
    }
  });

  return filter;
};

/**
 * Build sort options for Sequelize queries
 * @param {Object} query - Request query object
 * @returns {Object} Sequelize sort options
 */
export const getSortOptions = (query: any) => {
  const sortField = query.sort || 'created_at';
  const sortOrder = query.order?.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

  return { [sortField]: sortOrder };
};

/**
 * Parse a value as numeric if possible, otherwise return the original value
 * @param {String} value - Value to parse
 * @returns {Number|String|Boolean|null} Parsed value
 */
export const parseNumericIfPossible = (value: any) => {
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (value === 'null') return null;

  const number = Number(value);
  return !isNaN(number) && value?.toString().trim() !== '' ? number : value;
};
