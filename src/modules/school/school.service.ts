// modules/school/school.service.ts

import { School, UserRole } from '@/interfaces';
import {
  validateSchool,
  validateKidSchoolAssociation,
} from './school.validator';
import schoolRepo from './school.repo';
import kidRepo from '../kid/kid.repo';
import { CustomError } from '@/utils/custom-error';
import { DB } from '@/database';
import { sendSuccess, sendError } from '@/middlewares/response.middleware';

/**
 * Get all schools with filtering and pagination
 * @param {Object} queryParams - Query parameters for filtering and pagination
 * @returns {Promise<Object>} Standardized response with schools data
 */
export const getAllSchoolsService = async (
  queryParams: any = {},
): Promise<any> => {
  try {
    const result = await schoolRepo.findAllSchools(queryParams);
    return sendSuccess(result.data, 'Schools retrieved successfully', {
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
 * Get a school by ID
 * @param {string} schoolId - School ID
 * @returns {Promise<Object>} Standardized response with school data
 */
export const getSchoolByIdService = async (schoolId: string): Promise<any> => {
  if (!schoolId) {
    throw new CustomError('School ID is required', 400);
  }

  try {
    const school = await schoolRepo.findById(schoolId);

    if (!school) {
      throw new CustomError('School not found', 404);
    }

    return sendSuccess(school, 'School retrieved successfully', {
      isSingleItem: true,
    });
  } catch (error) {
    throw error;
  }
};

/**
 * Create a new school
 * @param {School} schoolData - School data
 * @returns {Promise<Object>} Standardized response with created school data
 */
export const createSchoolService = async (schoolData: School): Promise<any> => {
  try {
    // Validate school data
    const { error } = validateSchool(schoolData);
    if (error) {
      throw new CustomError(error.details[0].message, 400);
    }

    // Check if school with same name already exists
    const existingSchool = await schoolRepo.findSchoolByName(schoolData.name);
    if (existingSchool) {
      throw new CustomError(
        `School with name "${schoolData.name}" already exists`,
        409,
      );
    }

    // Create the school
    const school = await schoolRepo.create(schoolData);

    return sendSuccess(school, 'School created successfully', {
      isSingleItem: true,
    });
  } catch (error) {
    throw error;
  }
};

/**
 * Update an existing school
 * @param {string} schoolId - School ID
 * @param {Partial<School>} schoolData - School data to update
 * @returns {Promise<Object>} Standardized response with updated school data
 */
export const updateSchoolService = async (
  schoolId: string,
  schoolData: Partial<School>,
): Promise<any> => {
  try {
    // Check if school exists
    const existingSchool = await schoolRepo.findById(schoolId);
    if (!existingSchool) {
      throw new CustomError('School not found', 404);
    }

    // Validate update data
    const { error } = validateSchool(
      { ...existingSchool.get({ plain: true }), ...schoolData },
      true,
    );
    if (error) {
      throw new CustomError(error.details[0].message, 400);
    }

    // Check if new name conflicts with existing school
    if (schoolData.name && schoolData.name !== existingSchool.name) {
      const nameConflict = await schoolRepo.findSchoolByName(schoolData.name);
      if (nameConflict && nameConflict.id !== schoolId) {
        throw new CustomError(
          `School with name "${schoolData.name}" already exists`,
          409,
        );
      }
    }

    // Update the school
    await schoolRepo.update(schoolId, schoolData);

    // Get updated school
    const updatedSchool = await schoolRepo.findById(schoolId);

    return sendSuccess(updatedSchool, 'School updated successfully', {
      isSingleItem: true,
    });
  } catch (error) {
    throw error;
  }
};

/**
 * Delete a school
 * @param {string} schoolId - School ID
 * @returns {Promise<Object>} Standardized response
 */
export const deleteSchoolService = async (schoolId: string): Promise<any> => {
  try {
    // Check if school exists
    const school = await schoolRepo.findById(schoolId);
    if (!school) {
      throw new CustomError('School not found', 404);
    }

    // Check if school has associated kids
    const hasKids = await schoolRepo.checkSchoolHasKids(schoolId);
    if (hasKids) {
      throw new CustomError(
        'Cannot delete school that has kids assigned. Deactivate it instead.',
        400,
      );
    }

    // Delete the school
    await schoolRepo.delete(schoolId);

    return sendSuccess([], 'School deleted successfully');
  } catch (error) {
    throw error;
  }
};

/**
 * Get all kids associated with a school
 * @param {string} schoolId - School ID
 * @param {Object} queryParams - Query parameters for filtering and pagination
 * @returns {Promise<Object>} Standardized response with kids data
 */
export const getSchoolKidsService = async (
  schoolId: string,
  queryParams: any = {},
): Promise<any> => {
  if (!schoolId) {
    throw new CustomError('School ID is required', 400);
  }

  try {
    // Check if school exists
    const school = await schoolRepo.findById(schoolId);
    if (!school) {
      throw new CustomError('School not found', 404);
    }

    const result = await schoolRepo.getSchoolKids(schoolId, queryParams);
    return sendSuccess(result.data, 'School kids retrieved successfully', {
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
    const school = await schoolRepo.findById(schoolId);
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
    const association = await schoolRepo.addKidToSchool(kidId, schoolId);

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
    const school = await schoolRepo.findById(schoolId);
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
    await schoolRepo.removeKidFromSchool(kidId, schoolId);

    return sendSuccess([], 'Kid removed from school successfully');
  } catch (error) {
    throw error;
  }
};
