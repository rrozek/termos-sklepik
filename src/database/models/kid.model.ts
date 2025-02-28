import { Sequelize, DataTypes, Model, Optional } from 'sequelize';
import { Kid } from '@/interfaces';

export type KidCreationAttributes = Optional<
  Kid,
  'id' | 'created_at' | 'updated_at'
>;

export class KidModel extends Model<Kid, KidCreationAttributes> implements Kid {
  public id!: string;
  public name!: string;
  public parent_id!: string;
  public rfid_token!: string[];
  public monthly_spending_limit?: number;
  public is_active!: boolean;
  public created_at!: Date;
  public updated_at!: Date;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export default function (sequelize: Sequelize): typeof KidModel {
  KidModel.init(
    {
      id: {
        primaryKey: true,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
      },
      name: {
        allowNull: false,
        type: DataTypes.STRING(100),
      },
      parent_id: {
        allowNull: false,
        type: DataTypes.UUID,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      rfid_token: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        defaultValue: [],
      },
      monthly_spending_limit: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0.0,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: 'kids',
      sequelize,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      timestamps: true,
    },
  );

  return KidModel;
}
