import { DB } from '@/database';
import { UserCreationAttributes } from '@/database/models/user.model';
import { User } from '@/interfaces';

const repo = {
  findUserByEmail: async (email: string): Promise<User | null> => {
    return await DB.Users.findOne({ where: { email } });
  },

  findUserById: async (userId: string): Promise<User | null> => {
    return await DB.Users.findByPk(userId);
  },

  findUserByPortalUserId: async (
    portalUserId: number,
  ): Promise<User | null> => {
    return await DB.Users.findOne({ where: { portal_user_id: portalUserId } });
  },

  createUser: async (userData: UserCreationAttributes): Promise<User> => {
    return await DB.Users.create(userData);
  },

  updateUser: async (
    userId: string,
    userData: Partial<User>,
  ): Promise<User> => {
    const [, user] = await DB.Users.update(userData, {
      where: { id: userId },
      returning: true,
    });

    return user[0];
  },
};

export default repo;
