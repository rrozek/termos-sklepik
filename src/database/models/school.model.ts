import { Sequelize, DataTypes, Model, Optional } from 'sequelize';
import { School } from '@/interfaces';

export type SchoolCreationAttributes = Optional<
  School,
  'id' | 'created_at' | 'updated_at'
>;

export class SchoolModel
  extends Model<School, SchoolCreationAttributes>
  implements School
{
  public id!: string;
  public name!: string;
  public address?: string;
  public city?: string;
  public postal_code?: string;
  public contact_email?: string;
  public contact_phone?: string;
  public opening_hour?: string;
  public closing_hour?: string;
  public monday_enabled!: boolean;
  public tuesday_enabled!: boolean;
  public wednesday_enabled!: boolean;
  public thursday_enabled!: boolean;
  public friday_enabled!: boolean;
  public saturday_enabled!: boolean;
  public sunday_enabled!: boolean;
  public is_active!: boolean;
  public created_at!: Date;
  public updated_at!: Date;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export default function (sequelize: Sequelize): typeof SchoolModel {
  SchoolModel.init(
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
      address: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      city: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      postal_code: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      contact_email: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      contact_phone: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      opening_hour: {
        type: DataTypes.STRING(5),
        allowNull: true,
        comment: 'Time in 24-hour format (HH:MM)',
        validate: {
          is: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
        },
      },
      closing_hour: {
        type: DataTypes.STRING(5),
        allowNull: true,
        comment: 'Time in 24-hour format (HH:MM)',
        validate: {
          is: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
        },
      },
      monday_enabled: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      tuesday_enabled: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      wednesday_enabled: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      thursday_enabled: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      friday_enabled: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      saturday_enabled: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      sunday_enabled: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
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
      tableName: 'schools',
      sequelize,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      timestamps: true,
    },
  );

  return SchoolModel;
}
