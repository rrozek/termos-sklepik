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
};

export default userRepo;
