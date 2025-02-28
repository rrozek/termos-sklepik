import { NextFunction, Request, Response } from 'express';
import {
  createKidService,
  deleteKidService,
  getKidByIdService,
  getKidByRfidService,
  getParentKidsService,
  updateKidService,
} from './kid.service';

export const getParentKidsController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const parentId = req.context?.userId;
    const kids = await getParentKidsService(parentId);

    res.status(200).json({
      success: true,
      message: 'Kids retrieved successfully',
      data: kids,
    });
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
    const kid = await getKidByIdService(id, parentId);

    res.status(200).json({
      success: true,
      message: 'Kid retrieved successfully',
      data: kid,
    });
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
    const kid = await getKidByRfidService(token);

    res.status(200).json({
      success: true,
      message: 'Kid retrieved successfully',
      data: kid,
    });
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
    const kidData = {
      ...req.body,
      parent_id: parentId,
    };

    const newKid = await createKidService(kidData);

    res.status(201).json({
      success: true,
      message: 'Kid created successfully',
      data: newKid,
    });
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
    const kidData = req.body;

    const updatedKid = await updateKidService(id, parentId, kidData);

    res.status(200).json({
      success: true,
      message: 'Kid updated successfully',
      data: updatedKid,
    });
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

    await deleteKidService(id, parentId);

    res.status(200).json({
      success: true,
      message: 'Kid deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
