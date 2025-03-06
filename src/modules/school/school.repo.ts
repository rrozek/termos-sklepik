// modules/school/school.repo.ts

import { BaseRepository } from '@/base/repository.base';
import { DB } from '@/database';
import { SchoolModel } from '@/database/models/school.model';
import { Op, WhereOptions } from 'sequelize';

class SchoolRepository extends BaseRepository<SchoolModel> {
  constructor() {
    super(DB.Schools);
  }

  /**
   * Find all schools with filtering and pagination
   * @param {Object} queryParams - Request query parameters
   * @returns {Promise<Object>} Schools and pagination metadata
   */
  async findAllSchools(queryParams: any = {}): Promise<any> {
    const { page, limit, skip } = this.getPaginationParams(queryParams);
    const { name, city, isActive } = queryParams;

    const whereClause: WhereOptions = {};

    if (name) {
      whereClause.name = {
        [Op.iLike]: `%${name}%`,
      };
    }

    if (city) {
      whereClause.city = {
        [Op.iLike]: `%${city}%`,
      };
    }

    if (isActive !== undefined) {
      whereClause.is_active = isActive === 'true';
    }

    try {
      const { rows, count } = await DB.Schools.findAndCountAll({
        where: whereClause,
        order: [['name', 'ASC']],
        limit,
        offset: skip,
      });

      return {
        data: rows,
        page,
        limit,
        totalItems: count,
        totalPages: Math.ceil(count / limit),
        hasNextPage: page < Math.ceil(count / limit),
        hasPrevPage: page > 1,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Find a school by name
   * @param {string} name - School name
   * @returns {Promise<SchoolModel|null>} School
   */
  async findSchoolByName(name: string): Promise<SchoolModel | null> {
    try {
      return await DB.Schools.findOne({
        where: { name },
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Check if a school has associated kids
   * @param {string} schoolId - School ID
   * @returns {Promise<boolean>} Whether school has kids
   */
  async checkSchoolHasKids(schoolId: string): Promise<boolean> {
    try {
      const count = await DB.KidSchools.count({
        where: { school_id: schoolId },
      });
      return count > 0;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get all kids associated with a school
   * @param {string} schoolId - School ID
   * @param {Object} queryParams - Request query parameters
   * @returns {Promise<Object>} Kids and pagination metadata
   */
  async getSchoolKids(schoolId: string, queryParams: any = {}): Promise<any> {
    const { page, limit, skip } = this.getPaginationParams(queryParams);
    const { name, isActive } = queryParams;

    const whereClause: WhereOptions = {};

    if (name) {
      whereClause.name = {
        [Op.iLike]: `%${name}%`,
      };
    }

    if (isActive !== undefined) {
      whereClause.is_active = isActive === 'true';
    }

    try {
      const { rows, count } = await DB.Kids.findAndCountAll({
        include: [
          {
            model: DB.Schools,
            as: 'schools',
            where: { id: schoolId },
            through: { attributes: [] },
            required: true,
          },
        ],
        where: whereClause,
        order: [['name', 'ASC']],
        limit,
        offset: skip,
        distinct: true,
      });

      return {
        data: rows,
        page,
        limit,
        totalItems: count,
        totalPages: Math.ceil(count / limit),
        hasNextPage: page < Math.ceil(count / limit),
        hasPrevPage: page > 1,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Add a kid to a school
   * @param {string} kidId - Kid ID
   * @param {string} schoolId - School ID
   * @returns {Promise<any>} Kid-school association
   */
  async addKidToSchool(kidId: string, schoolId: string): Promise<any> {
    try {
      return await DB.KidSchools.create({
        kid_id: kidId,
        school_id: schoolId,
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Remove a kid from a school
   * @param {string} kidId - Kid ID
   * @param {string} schoolId - School ID
   * @returns {Promise<number>} Number of affected rows
   */
  async removeKidFromSchool(kidId: string, schoolId: string): Promise<number> {
    try {
      return await DB.KidSchools.destroy({
        where: {
          kid_id: kidId,
          school_id: schoolId,
        },
      });
    } catch (error) {
      throw error;
    }
  }

  // Helper method to get pagination parameters
  private getPaginationParams(query: any) {
    const page = parseInt(query.page?.toString() || '1', 10);
    const limit = parseInt(query.limit?.toString() || '10', 10);
    const skip = (page - 1) * limit;

    return { page, limit, skip };
  }
}

export default new SchoolRepository();
