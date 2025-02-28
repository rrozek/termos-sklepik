import { DB } from '@/database';
import { KidCreationAttributes } from '@/database/models/kid.model';
import { Kid } from '@/interfaces';
import { Op } from 'sequelize';

const kidRepo = {
  findKidsByParentId: async (parentId: string): Promise<Kid[]> => {
    return await DB.Kids.findAll({
      where: { parent_id: parentId },
      order: [['created_at', 'DESC']],
    });
  },

  findKidById: async (kidId: string): Promise<Kid | null> => {
    return await DB.Kids.findByPk(kidId);
  },

  findKidByRfid: async (rfidToken: string): Promise<Kid | null> => {
    return await DB.Kids.findOne({
      where: {
        rfid_token: { [Op.contains]: [rfidToken] },
        is_active: true,
      },
    });
  },

  createKid: async (kidData: KidCreationAttributes): Promise<Kid> => {
    return await DB.Kids.create(kidData);
  },

  updateKid: async (kidId: string, kidData: Partial<Kid>): Promise<Kid> => {
    const [_, updatedKids] = await DB.Kids.update(kidData, {
      where: { id: kidId },
      returning: true,
    });

    return updatedKids[0];
  },

  deleteKid: async (kidId: string): Promise<number> => {
    return await DB.Kids.destroy({ where: { id: kidId } });
  },

  checkParentExists: async (parentId: string): Promise<boolean> => {
    const count = await DB.Users.count({ where: { id: parentId } });
    return count > 0;
  },

  checkKidHasOrders: async (kidId: string): Promise<boolean> => {
    const count = await DB.Orders.count({ where: { kid_id: kidId } });
    return count > 0;
  },
};

export default kidRepo;
