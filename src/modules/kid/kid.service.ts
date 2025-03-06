// modules/kid/kid.service.ts

import { Kid, UserRole } from '@/interfaces';
import { validateKid } from './kid.validator';
import { validateKidSchoolAssociation } from '../school/school.validator';
import kidRepo from './kid.repo';
import { CustomError } from '@/utils/custom-error';
import { DB } from '@/database';
import { sendSuccess, sendError } from '@/middlewares/response.middleware';

/**
 * Get all kids belonging to a specific parent
 * @param {string} parentId - Parent ID
 * @param {Object} queryParams - Query parameters for filtering and pagination
 * @returns {Promise<Object>} Standardized response with kids data
 */
export const getParentKidsService = async (
  parentId: string,
  queryParams: any = {},
): Promise<any> => {
  if (!parentId) {
    throw new CustomError('Parent ID is required', 400);
  }

  try {
    const result = await kidRepo.findKidsByParentId(parentId, queryParams);
    return sendSuccess(result.data, 'Kids retrieved successfully', {
      page: result.page,
      limit: result.limit,
      totalItems: result.totalItems,
      totalPages: result.totalPages,
      hasNextPage: result.hasNextPage,
      hasPrevPage: result.hasPrevPage,
    });
  } catch (error) {
    throw error;
  }
};

/**
 * Get all kids (admin/staff only)
 * @param {Object} queryParams - Query parameters for filtering and pagination
 * @returns {Promise<Object>} Standardized response with kids data
 */
export const getAllKidsService = async (
  queryParams: any = {},
): Promise<any> => {
  try {
    const result = await kidRepo.findAll(queryParams);
    return sendSuccess(result.data, 'Kids retrieved successfully', {
      page: result.page,
      limit: result.limit,
      totalItems: result.totalItems,
      totalPages: result.totalPages,
      hasNextPage: result.hasNextPage,
      hasPrevPage: result.hasPrevPage,
    });
  } catch (error) {
    throw error;
  }
};

/**
 * Get a kid by ID
 * @param {string} kidId - Kid ID
 * @param {string} parentId - Parent ID
 * @param {UserRole} userRole - User role
 * @param {boolean} includeSchools - Whether to include schools in the response
 * @returns {Promise<Object>} Standardized response with kid data
 */
export const getKidByIdService = async (
  kidId: string,
  parentId: string,
  userRole: UserRole = UserRole.PARENT,
  includeSchools = false,
): Promise<any> => {
  if (!kidId) {
    throw new CustomError('Kid ID is required', 400);
  }

  try {
    // Define include options if schools are requested
    const include = includeSchools
      ? [{ model: DB.Schools, as: 'schools', through: { attributes: [] } }]
      : [];

    const kid = await kidRepo.findById(kidId, include);

    if (!kid) {
      throw new CustomError('Kid not found', 404);
    }

    // Admins and staff can access any kid, parents only their own
    if (userRole !== UserRole.ADMIN && userRole !== UserRole.STAFF) {
      if (!parentId) {
        throw new CustomError('Parent ID is required', 400);
      }

      // Ensure the kid belongs to this parent
      if (kid.parent_id !== parentId) {
        throw new CustomError(
          'Access denied: Kid does not belong to this parent',
          403,
        );
      }
    }

    return sendSuccess(kid, 'Kid retrieved successfully', {
      isSingleItem: true,
    });
  } catch (error) {
    throw error;
  }
};

/**
 * Get a kid by RFID token
 * @param {string} rfidToken - RFID token
 * @returns {Promise<Object>} Standardized response with kid data
 */
export const getKidByRfidService = async (rfidToken: string): Promise<any> => {
  if (!rfidToken) {
    throw new CustomError('RFID token is required', 400);
  }

  try {
    const kid = await kidRepo.findKidByRfid(rfidToken);

    if (!kid) {
      throw new CustomError('Kid not found with this RFID token', 404);
    }

    return sendSuccess(kid, 'Kid retrieved successfully', {
      isSingleItem: true,
    });
  } catch (error) {
    throw error;
  }
};

/**
 * Create a new kid
 * @param {Kid} kidData - Kid data
 * @param {string[]} schoolIds - School IDs to associate with the kid
 * @returns {Promise<Object>} Standardized response with created kid data
 */
export const createKidService = async (
  kidData: Kid,
  schoolIds?: string[],
): Promise<any> => {
  try {
    // Validate kid data
    const { error } = validateKid(kidData);
    if (error) {
      throw new CustomError(error.details[0].message, 400);
    }

    // Check if parent exists
    const parentExists = await kidRepo.exists({ id: kidData.parent_id });
    if (!parentExists) {
      throw new CustomError('Parent not found', 404);
    }

    // Check if RFID token is already in use if provided
    if (kidData.rfid_token && kidData.rfid_token.length > 0) {
      for (const token of kidData.rfid_token) {
        const existingKid = await kidRepo.findKidByRfid(token);
        if (existingKid) {
          throw new CustomError(
            `RFID token ${token} is already assigned to another kid`,
            409,
          );
        }
      }
    }

    // Start transaction
    const transaction = await DB.sequelize.transaction();

    try {
      // Create the kid
      const kid = await kidRepo.create(kidData, { transaction });

      // If school IDs are provided, associate kid with schools
      if (schoolIds && schoolIds.length > 0) {
        for (const schoolId of schoolIds) {
          await DB.KidSchools.create(
            {
              kid_id: kid.id,
              school_id: schoolId,
            },
            { transaction },
          );
        }
      }

      // Commit transaction
      await transaction.commit();

      // Get kid with schools
      const include = [
        { model: DB.Schools, as: 'schools', through: { attributes: [] } },
      ];
      const createdKid = await kidRepo.findById(kid.id, include);

      return sendSuccess(createdKid, 'Kid created successfully', {
        isSingleItem: true,
      });
    } catch (error) {
      // Rollback transaction on error
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    throw error;
  }
};

/**
 * Update an existing kid
 * @param {string} kidId - Kid ID
 * @param {string} parentId - Parent ID
 * @param {Partial<Kid>} kidData - Kid data to update
 * @param {UserRole} userRole - User role
 * @param {string[]} schoolIds - School IDs to associate with the kid
 * @returns {Promise<Object>} Standardized response with updated kid data
 */
export const updateKidService = async (
  kidId: string,
  parentId: string,
  kidData: Partial<Kid>,
  userRole: UserRole = UserRole.PARENT,
  schoolIds?: string[],
): Promise<any> => {
  try {
    // Check if kid exists and belongs to parent/staff
    const existingKid = await getKidByIdService(kidId, parentId, userRole);
    if (!existingKid || !existingKid.data) {
      throw new CustomError('Kid not found', 404);
    }

    // Validate update data
    const { error } = validateKid({ ...existingKid.data, ...kidData }, true);
    if (error) {
      throw new CustomError(error.details[0].message, 400);
    }

    // Check if RFID token is already in use if being updated
    if (kidData.rfid_token && kidData.rfid_token.length > 0) {
      for (const token of kidData.rfid_token) {
        const tokenKid = await kidRepo.findKidByRfid(token);
        if (tokenKid && tokenKid.id !== kidId) {
          throw new CustomError(
            `RFID token ${token} is already assigned to another kid`,
            409,
          );
        }
      }
    }

    // Start transaction
    const transaction = await DB.sequelize.transaction();

    try {
      // Update the kid
      const updatedKid = await kidRepo.update(kidId, kidData, { transaction });

      // If school IDs are provided, update kid's schools
      if (schoolIds !== undefined) {
        // Remove all existing associations
        await DB.KidSchools.destroy({
          where: { kid_id: kidId },
          transaction,
        });

        // Add new associations
        if (schoolIds.length > 0) {
          for (const schoolId of schoolIds) {
            await DB.KidSchools.create(
              {
                kid_id: kidId,
                school_id: schoolId,
              },
              { transaction },
            );
          }
        }
      }

      // Commit transaction
      await transaction.commit();

      // Get updated kid with schools
      const include = [
        { model: DB.Schools, as: 'schools', through: { attributes: [] } },
      ];
      const result = await kidRepo.findById(kidId, include);

      return sendSuccess(result, 'Kid updated successfully', {
        isSingleItem: true,
      });
    } catch (error) {
      // Rollback transaction on error
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    throw error;
  }
};

/**
 * Delete or deactivate a kid
 * @param {string} kidId - Kid ID
 * @param {string} parentId - Parent ID
 * @param {UserRole} userRole - User role
 * @returns {Promise<Object>} Standardized response
 */
export const deleteKidService = async (
  kidId: string,
  parentId: string,
  userRole: UserRole = UserRole.PARENT,
): Promise<any> => {
  try {
    // Check if kid exists and belongs to parent/staff
    const kid = await getKidByIdService(kidId, parentId, userRole);
    if (!kid || !kid.data) {
      throw new CustomError('Kid not found', 404);
    }

    // Start transaction
    const transaction = await DB.sequelize.transaction();

    try {
      // Check if kid has any orders
      const hasOrders = await kidRepo.checkKidHasOrders(kidId);

      if (hasOrders) {
        // If kid has orders, just deactivate rather than delete
        await kidRepo.update(kidId, { is_active: false }, { transaction });
      } else {
        // Delete kid's school associations
        await DB.KidSchools.destroy({
          where: { kid_id: kidId },
          transaction,
        });

        // If no orders, can safely delete
        await kidRepo.delete(kidId, { transaction });
      }

      // Commit transaction
      await transaction.commit();

      return sendSuccess(
        [],
        hasOrders ? 'Kid deactivated successfully' : 'Kid deleted successfully',
      );
    } catch (error) {
      // Rollback transaction on error
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    throw error;
  }
};

/**
 * Get all schools associated with a kid
 * @param {string} kidId - Kid ID
 * @returns {Promise<Object>} Standardized response with schools data
 */
export const getKidSchoolsService = async (kidId: string): Promise<any> => {
  try {
    // Check if kid exists
    const exists = await kidRepo.exists({ id: kidId });
    if (!exists) {
      throw new CustomError('Kid not found', 404);
    }

    // Find kid with schools
    const kid = await kidRepo.findById(kidId, [
      {
        model: DB.Schools,
        as: 'schools',
        through: { attributes: [] },
      },
    ]);

    if (!kid) {
      throw new CustomError('Kid not found', 404);
    }

    // Extract schools from kid
    const schools = kid.get('schools') || [];

    return sendSuccess(schools, 'Kid schools retrieved successfully');
  } catch (error) {
    throw error;
  }
};

/**
 * Add a kid to a school
 * @param {string} kidId - Kid ID
 * @param {string} schoolId - School ID
 * @param {string} parentId - Parent ID
 * @param {UserRole} role - User role
 * @returns {Promise<Object>} Standardized response
 */
export const addKidToSchoolService = async (
  kidId: string,
  schoolId: string,
  parentId: string,
  role?: string,
): Promise<any> => {
  try {
    // Validate parameters
    const { error } = validateKidSchoolAssociation({
      kid_id: kidId,
      school_id: schoolId,
    });
    if (error) {
      throw new CustomError(error.details[0].message, 400);
    }

    // Check if kid exists
    const kid = await kidRepo.findById(kidId);
    if (!kid) {
      throw new CustomError('Kid not found', 404);
    }

    // Check if kid belongs to parent or user is admin/staff
    if (role !== UserRole.ADMIN && role !== UserRole.STAFF) {
      if (!parentId) {
        throw new CustomError('Parent ID is required', 400);
      }

      if (kid.parent_id !== parentId) {
        throw new CustomError(
          'Access denied: Kid does not belong to this parent',
          403,
        );
      }
    }

    // Check if school exists
    const school = await DB.Schools.findByPk(schoolId);
    if (!school) {
      throw new CustomError('School not found', 404);
    }

    // Check if association already exists
    const existingAssociation = await DB.KidSchools.findOne({
      where: {
        kid_id: kidId,
        school_id: schoolId,
      },
    });

    if (existingAssociation) {
      return sendSuccess(
        existingAssociation,
        'Kid already associated with this school',
        { isSingleItem: true },
      );
    }

    // Add kid to school
    const association = await DB.KidSchools.create({
      kid_id: kidId,
      school_id: schoolId,
    });

    return sendSuccess(association, 'Kid added to school successfully', {
      isSingleItem: true,
    });
  } catch (error) {
    throw error;
  }
};

/**
 * Remove a kid from a school
 * @param {string} kidId - Kid ID
 * @param {string} schoolId - School ID
 * @param {string} parentId - Parent ID
 * @param {UserRole} role - User role
 * @returns {Promise<Object>} Standardized response
 */
export const removeKidFromSchoolService = async (
  kidId: string,
  schoolId: string,
  parentId: string,
  role?: string,
): Promise<any> => {
  try {
    // Validate parameters
    const { error } = validateKidSchoolAssociation({
      kid_id: kidId,
      school_id: schoolId,
    });
    if (error) {
      throw new CustomError(error.details[0].message, 400);
    }

    // Check if kid exists
    const kid = await kidRepo.findById(kidId);
    if (!kid) {
      throw new CustomError('Kid not found', 404);
    }

    // Check if kid belongs to parent or user is admin/staff
    if (role !== UserRole.ADMIN && role !== UserRole.STAFF) {
      if (!parentId) {
        throw new CustomError('Parent ID is required', 400);
      }

      if (kid.parent_id !== parentId) {
        throw new CustomError(
          'Access denied: Kid does not belong to this parent',
          403,
        );
      }
    }

    // Check if school exists
    const school = await DB.Schools.findByPk(schoolId);
    if (!school) {
      throw new CustomError('School not found', 404);
    }

    // Get the association
    const association = await DB.KidSchools.findOne({
      where: {
        kid_id: kidId,
        school_id: schoolId,
      },
    });

    if (!association) {
      throw new CustomError('Kid is not associated with this school', 404);
    }

    // Remove the association
    await association.destroy();

    return sendSuccess([], 'Kid removed from school successfully');
  } catch (error) {
    throw error;
  }
};

/**
 * Update all schools for a kid
 * @param {string} kidId - Kid ID
 * @param {string[]} schoolIds - School IDs to associate with the kid
 * @param {string} parentId - Parent ID
 * @param {UserRole} role - User role
 * @returns {Promise<Object>} Standardized response
 */
export const updateKidSchoolsService = async (
  kidId: string,
  schoolIds: string[],
  parentId: string,
  role?: string,
): Promise<any> => {
  try {
    // Check if kid exists
    const kid = await kidRepo.findById(kidId);
    if (!kid) {
      throw new CustomError('Kid not found', 404);
    }

    // Check if kid belongs to parent or user is admin/staff
    if (role !== UserRole.ADMIN && role !== UserRole.STAFF) {
      if (!parentId) {
        throw new CustomError('Parent ID is required', 400);
      }

      if (kid.parent_id !== parentId) {
        throw new CustomError(
          'Access denied: Kid does not belong to this parent',
          403,
        );
      }
    }

    // Verify all school IDs exist
    if (schoolIds.length > 0) {
      const schools = await DB.Schools.findAll({
        where: {
          id: schoolIds,
        },
      });

      if (schools.length !== schoolIds.length) {
        throw new CustomError('One or more schools not found', 404);
      }
    }

    // Start transaction
    const transaction = await DB.sequelize.transaction();

    try {
      // Get current associations
      const currentAssociations = await DB.KidSchools.findAll({
        where: {
          kid_id: kidId,
        },
      });

      const currentSchoolIds = currentAssociations.map(
        assoc => assoc.school_id,
      );

      // Schools to remove (in current but not in new list)
      const schoolIdsToRemove = currentSchoolIds.filter(
        id => !schoolIds.includes(id),
      );

      // Schools to add (in new list but not in current)
      const schoolIdsToAdd = schoolIds.filter(
        id => !currentSchoolIds.includes(id),
      );

      if (schoolIdsToRemove.length > 0) {
        await DB.KidSchools.destroy({
          where: {
            kid_id: kidId,
            school_id: schoolIdsToRemove,
          },
          transaction,
        });
      }

      // Add new associations
      for (const schoolId of schoolIdsToAdd) {
        // Check if association already exists but is inactive
        const existingAssoc = await DB.KidSchools.findOne({
          where: {
            kid_id: kidId,
            school_id: schoolId,
          },
        });

        if (!existingAssoc) {
          // Create new association
          await DB.KidSchools.create(
            {
              kid_id: kidId,
              school_id: schoolId,
            },
            { transaction },
          );
        }
      }

      // Commit transaction
      await transaction.commit();

      // Get updated schools
      const updatedKid = await kidRepo.findById(kidId, [
        {
          model: DB.Schools,
          as: 'schools',
          through: { attributes: [] },
        },
      ]);

      const updatedSchools = updatedKid ? updatedKid.get('schools') || [] : [];

      return sendSuccess(updatedSchools, 'Kid schools updated successfully');
    } catch (error) {
      // Rollback transaction on error
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    throw error;
  }
};
