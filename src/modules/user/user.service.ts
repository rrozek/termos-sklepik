import { CustomError } from '@/utils/custom-error';
import userRepo from './user.repo';

export const getUserProfileService = async (userId: string) => {
  if (!userId) {
    throw new CustomError('User ID is required', 400);
  }

  const user = await userRepo.getUserProfile(userId);

  if (!user) {
    throw new CustomError('User not found', 404);
  }

  // Don't return the password in the response
  const { password, ...userWithoutPassword } = user.get({ plain: true });

  return userWithoutPassword;
};
