import { Sequelize, DataTypes, Model, Optional } from 'sequelize';
import { User, UserRole } from '@/interfaces';

export type UserCreationAttributes = Optional<
  User,
  'id' | 'created_at' | 'updated_at' | 'phone'
>;

export class UserModel
  extends Model<User, UserCreationAttributes>
  implements User
{
  public id!: string;
  public email!: string;
  public password!: string;
  public name!: string;
  public role!: UserRole;
  public portal_user_id!: number;
  public phone?: string;
  public is_active!: boolean;
  public created_at!: Date;
  public updated_at!: Date;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export default function (sequelize: Sequelize): typeof UserModel {
  UserModel.init(
    {
      id: {
        primaryKey: true,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
      },
      email: {
        allowNull: false,
        type: DataTypes.STRING(45),
        unique: true,
      },
      password: {
        allowNull: false,
        type: DataTypes.STRING(255),
      },
      name: {
        allowNull: false,
        type: DataTypes.STRING(100),
      },
      role: {
        allowNull: false,
        type: DataTypes.ENUM(...Object.values(UserRole)),
        defaultValue: UserRole.PARENT,
      },
      portal_user_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      phone: {
        type: DataTypes.STRING(20),
        allowNull: true,
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
      tableName: 'users',
      sequelize,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      timestamps: true,
    },
  );

  return UserModel;
}
