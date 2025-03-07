import { DB } from '@/database';
import { UserModel } from '@/database/models/user.model';

const userRepo = {
  getUserProfile: async (userId: string): Promise<UserModel | null> => {
    return await DB.Users.findOne({
      where: { id: userId },
      include: [
        {
          model: DB.Kids,
          as: 'kids',
          attributes: ['id', 'name', 'rfid_token'],
        },
      ],
    });
  },

  findByPk: async (userId: string): Promise<UserModel | null> => {
    return await DB.Users.findByPk(userId);
  },

  findByRole: async (role: string): Promise<UserModel[]> => {
    return await DB.Users.findAll({
      where: { role },
    });
  },
};

export default userRepo;
