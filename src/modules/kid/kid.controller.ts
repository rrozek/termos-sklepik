// modules/kid/kid.controller.ts

import { NextFunction, Request, Response } from 'express';
import {
  createKidService,
  deleteKidService,
  getKidByIdService,
  getKidByRfidService,
  getParentKidsService,
  updateKidService,
  getAllKidsService,
  addKidToSchoolService,
  removeKidFromSchoolService,
  updateKidSchoolsService,
} from './kid.service';
import { UserRole } from '@/interfaces';

export const getParentKidsController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const parentId = req.context?.userId;

    // Pass along all query parameters
    const queryParams = req.query;

    const result = await getParentKidsService(parentId, queryParams);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const getAllKidsController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    // Pass along all query parameters
    const queryParams = req.query;

    const result = await getAllKidsService(queryParams);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const getKidByIdController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;
    const parentId = req.context?.userId;
    const role = (req.context?.role as UserRole) || UserRole.PARENT;
    const includeSchools = req.query.includeSchools === 'true';

    const result = await getKidByIdService(id, parentId, role, includeSchools);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const getKidByRfidController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { token } = req.params;
    const result = await getKidByRfidService(token);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const createKidController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const parentId = req.context?.userId;
    const { schoolIds, ...kidData } = req.body;

    const result = await createKidService(
      {
        ...kidData,
        parent_id: parentId,
      },
      schoolIds,
    );

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

export const updateKidController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;
    const parentId = req.context?.userId;
    const role = (req.context?.role as UserRole) || UserRole.PARENT;
    const { schoolIds, ...kidData } = req.body;

    const result = await updateKidService(
      id,
      parentId,
      kidData,
      role,
      schoolIds,
    );

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const deleteKidController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;
    const parentId = req.context?.userId;
    const role = (req.context?.role as UserRole) || UserRole.PARENT;

    await deleteKidService(id, parentId, role);

    res.status(200).json({
      success: true,
      message: 'Kid deleted successfully',
      data: [],
    });
  } catch (error) {
    next(error);
  }
};

export const addKidToSchoolController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { kidId, schoolId } = req.params;
    const parentId = req.context?.userId;
    const role = req.context?.role;

    const result = await addKidToSchoolService(kidId, schoolId, parentId, role);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const removeKidFromSchoolController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { kidId, schoolId } = req.params;
    const parentId = req.context?.userId;
    const role = req.context?.role;

    const result = await removeKidFromSchoolService(
      kidId,
      schoolId,
      parentId,
      role,
    );

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const updateKidSchoolsController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { kidId } = req.params;
    const { schoolIds } = req.body;
    const parentId = req.context?.userId;
    const role = req.context?.role;

    if (!Array.isArray(schoolIds)) {
      throw new Error('schoolIds must be an array');
    }

    const result = await updateKidSchoolsService(
      kidId,
      schoolIds,
      parentId,
      role,
    );

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
