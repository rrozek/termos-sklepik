import { Kid } from '@/interfaces';
import { validateKid } from './kid.validator';
import kidRepo from './kid.repo';
import { CustomError } from '@/utils/custom-error';

export const getParentKidsService = async (
  parentId: string,
): Promise<Kid[]> => {
  if (!parentId) {
    throw new CustomError('Parent ID is required', 400);
  }

  return await kidRepo.findKidsByParentId(parentId);
};

export const getKidByIdService = async (
  kidId: string,
  parentId: string,
): Promise<Kid> => {
  if (!kidId) {
    throw new CustomError('Kid ID is required', 400);
  }

  if (!parentId) {
    throw new CustomError('Parent ID is required', 400);
  }

  const kid = await kidRepo.findKidById(kidId);

  if (!kid) {
    throw new CustomError('Kid not found', 404);
  }

  // Ensure the kid belongs to this parent
  if (kid.parent_id !== parentId) {
    throw new CustomError(
      'Access denied: Kid does not belong to this parent',
      403,
    );
  }

  return kid;
};

export const getKidByRfidService = async (rfidToken: string): Promise<Kid> => {
  if (!rfidToken) {
    throw new CustomError('RFID token is required', 400);
  }

  const kid = await kidRepo.findKidByRfid(rfidToken);

  if (!kid) {
    throw new CustomError('Kid not found with this RFID token', 404);
  }

  return kid;
};

export const createKidService = async (kidData: Kid): Promise<Kid> => {
  // Validate kid data
  const { error } = validateKid(kidData);
  if (error) {
    throw new CustomError(error.details[0].message, 400);
  }

  // Check if parent exists
  const parentExists = await kidRepo.checkParentExists(kidData.parent_id);
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

  // Create the kid
  return await kidRepo.createKid(kidData);
};

export const updateKidService = async (
  kidId: string,
  parentId: string,
  kidData: Partial<Kid>,
): Promise<Kid> => {
  // Check if kid exists and belongs to parent
  const existingKid = await getKidByIdService(kidId, parentId);

  // Validate update data
  const { error } = validateKid({ ...existingKid, ...kidData }, true);
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

  // Update the kid
  return await kidRepo.updateKid(kidId, kidData);
};

export const deleteKidService = async (
  kidId: string,
  parentId: string,
): Promise<void> => {
  // Check if kid exists and belongs to parent
  await getKidByIdService(kidId, parentId);

  // Check if kid has any orders
  const hasOrders = await kidRepo.checkKidHasOrders(kidId);
  if (hasOrders) {
    // If kid has orders, just deactivate rather than delete
    await kidRepo.updateKid(kidId, { is_active: false });
  } else {
    // If no orders, can safely delete
    await kidRepo.deleteKid(kidId);
  }
};
