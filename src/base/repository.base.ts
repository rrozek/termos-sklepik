// repositories/BaseRepository.ts

import { DB } from '@/database';
import { Model, Op, WhereOptions, FindOptions } from 'sequelize';
import {
  getPaginationParams,
  buildFilterQuery,
  getSortOptions,
} from '@/utils/query';

/**
 * Base repository class that provides common database operations with pagination and filtering
 */
export class BaseRepository<T extends Model> {
  /**
   * Create a new repository instance
   * @param {typeof Model} model - Sequelize model
   */
  constructor(private model: any) {}

  /**
   * Find all documents with pagination and filtering
   * @param {Object} queryParams - Express request query parameters
   * @param {Object} filterMapping - Mapping of query params to database fields
   * @param {Array} include - Sequelize include options for related models
   * @returns {Promise<Object>} Documents and pagination metadata
   */
  async findAll(
    queryParams: any = {},
    filterMapping: any = {},
    include: any[] = [],
  ): Promise<any> {
    const { page, limit, skip } = getPaginationParams(queryParams);
    const filter = buildFilterQuery(queryParams, filterMapping);
    const sort = getSortOptions(queryParams);

    try {
      // Prepare find options
      const options: FindOptions = {
        where: filter,
        limit,
        offset: skip,
        order: Object.entries(sort).map(([field, direction]) => [
          field,
          direction,
        ]),
        include,
      };

      // Execute the query with pagination
      const { rows, count } = await this.model.findAndCountAll(options);

      // Calculate pagination metadata
      const totalItems = count;
      const totalPages = Math.ceil(totalItems / limit);

      return {
        data: rows,
        page,
        limit,
        totalItems,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      };
    } catch (error) {
      console.error('Error in findAll:', error);
      throw error;
    }
  }

  /**
   * Find a single document by ID
   * @param {String} id - Document ID
   * @param {Array} include - Sequelize include options for related models
   * @returns {Promise<T>} Document
   */
  async findById(id: string, include: any[] = []): Promise<T | null> {
    try {
      return await this.model.findByPk(id, { include });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Find a single document by custom filter
   * @param {Object} filter - Sequelize filter
   * @param {Array} include - Sequelize include options for related models
   * @returns {Promise<T>} Document
   */
  async findOne(filter: WhereOptions, include: any[] = []): Promise<T | null> {
    try {
      return await this.model.findOne({ where: filter, include });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Create a new document
   * @param {Object} data - Document data
   * @param {Object} options - Additional Sequelize options
   * @returns {Promise<T>} Created document
   */
  async create(data: any, options: any = {}): Promise<T> {
    try {
      return await this.model.create(data, options);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update a document
   * @param {String} id - Document ID
   * @param {Object} data - Document data
   * @param {Object} options - Additional Sequelize options
   * @returns {Promise<T>} Updated document
   */
  async update(id: string, data: any, options: any = {}): Promise<T> {
    try {
      const [, updatedItems] = await this.model.update(data, {
        where: { id },
        returning: true,
        ...options,
      });

      return updatedItems[0];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete a document
   * @param {String} id - Document ID
   * @param {Object} options - Additional Sequelize options
   * @returns {Promise<number>} Number of deleted documents
   */
  async delete(id: string, options: any = {}): Promise<number> {
    try {
      return await this.model.destroy({
        where: { id },
        ...options,
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Check if a document exists
   * @param {Object} filter - Sequelize filter
   * @returns {Promise<boolean>} Whether document exists
   */
  async exists(filter: WhereOptions): Promise<boolean> {
    try {
      const count = await this.model.count({ where: filter });
      return count > 0;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Count documents matching a filter
   * @param {Object} filter - Sequelize filter
   * @returns {Promise<number>} Count of documents
   */
  async count(filter: WhereOptions = {}): Promise<number> {
    try {
      return await this.model.count({ where: filter });
    } catch (error) {
      throw error;
    }
  }
}
