// modules/kid/kid.repo.ts

import { BaseRepository } from '@/base/repository.base';
import { DB } from '@/database';
import { Kid } from '@/interfaces';
import { KidModel } from '@/database/models/kid.model';
import { Op } from 'sequelize';

class KidRepository extends BaseRepository<KidModel> {
  constructor() {
    super(DB.Kids);
  }

  /**
   * Find kids by parent ID with filtering
   * @param {string} parentId - Parent ID
   * @param {Object} queryParams - Request query parameters
   * @returns {Promise<Object>} Kids and pagination metadata
   */
  async findKidsByParentId(
    parentId: string,
    queryParams: any = {},
  ): Promise<any> {
    const { page, limit, skip } = this.getPaginationParams(queryParams);
    const { name, isActive, schoolId } = queryParams;

    const whereClause: any = {
      parent_id: parentId,
    };

    if (name) {
      whereClause.name = {
        [Op.iLike]: `%${name}%`,
      };
    }

    if (isActive !== undefined) {
      whereClause.is_active = isActive === 'true';
    }

    const include: any[] = [
      {
        model: DB.Schools,
        as: 'schools',
        through: { attributes: [] }, // Don't include join table attributes
        required: Boolean(schoolId), // Only required if filtering by schoolId
      },
    ];

    if (schoolId) {
      include[0].where = { id: schoolId };
    }

    try {
      const { rows, count } = await DB.Kids.findAndCountAll({
        where: whereClause,
        include,
        order: [['name', 'ASC']],
        limit,
        offset: skip,
        distinct: true, // Needed for correct count with associations
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
   * Find a kid by RFID token
   * @param {string} rfidToken - RFID token
   * @returns {Promise<KidModel|null>} Kid
   */
  async findKidByRfid(rfidToken: string): Promise<KidModel | null> {
    try {
      return await DB.Kids.findOne({
        where: {
          rfid_token: { [Op.contains]: [rfidToken] },
          is_active: true,
        },
        include: [
          {
            model: DB.Schools,
            as: 'schools',
            through: { attributes: [] },
            required: false,
          },
        ],
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Check if a kid has any orders
   * @param {string} kidId - Kid ID
   * @returns {Promise<boolean>} Whether kid has orders
   */
  async checkKidHasOrders(kidId: string): Promise<boolean> {
    try {
      const count = await DB.Orders.count({ where: { kid_id: kidId } });
      return count > 0;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Find a kid with its schools
   * @param {string} kidId - Kid ID
   * @returns {Promise<KidModel|null>} Kid with schools
   */
  async findKidWithSchools(kidId: string): Promise<KidModel | null> {
    try {
      return await DB.Kids.findByPk(kidId, {
        include: [
          {
            model: DB.Schools,
            as: 'schools',
            through: { attributes: [] },
          },
        ],
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Find all kids with spending limits
   * @returns {Promise<KidModel[]>} Kids with spending limits
   */
  async findAllWithSpendingLimits(): Promise<KidModel[]> {
    try {
      return await DB.Kids.findAll({
        where: {
          is_active: true,
          monthly_spending_limit: {
            [Op.gt]: 0,
          },
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

export default new KidRepository();
