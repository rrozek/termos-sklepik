// modules/school/school.controller.ts

import { NextFunction, Request, Response } from 'express';
import {
  getAllSchoolsService,
  getSchoolByIdService,
  createSchoolService,
  updateSchoolService,
  deleteSchoolService,
  addKidToSchoolService,
  removeKidFromSchoolService,
  getSchoolKidsService,
} from './school.service';
import logger from '@/utils/logger';

/**
 * Get all schools with filtering and pagination
 */
export const getAllSchoolsController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    // Pass all query parameters to the service
    const result = await getAllSchoolsService(req.query);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Get a school by ID
 */
export const getSchoolByIdController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await getSchoolByIdService(id);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new school
 */
export const createSchoolController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const schoolData = req.body;
    const result = await createSchoolService(schoolData);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Update an existing school
 */
export const updateSchoolController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;
    const schoolData = req.body;
    const result = await updateSchoolService(id, schoolData);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a school
 */
export const deleteSchoolController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await deleteSchoolService(id);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Add a kid to a school
 */
export const addKidToSchoolController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { kidId, schoolId } = req.params;
    const parentId = req.context?.userId;
    const result = await addKidToSchoolService(kidId, schoolId, parentId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Remove a kid from a school
 */
export const removeKidFromSchoolController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { kidId, schoolId } = req.params;
    const parentId = req.context?.userId;
    const result = await removeKidFromSchoolService(kidId, schoolId, parentId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Get kids associated with a school
 */
export const getSchoolKidsController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await getSchoolKidsService(id);
    res.status(200).json(result);
  } catch (error) {
    logger.error(`Error getting kids for school ${id}: ${error}`);
    next(error);
  }
};
