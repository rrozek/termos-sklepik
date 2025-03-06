import { Sequelize, DataTypes, Model, Optional } from 'sequelize';
import { KidSchool } from '@/interfaces';

export type KidSchoolCreationAttributes = Optional<
  KidSchool,
  'id' | 'created_at' | 'updated_at'
>;

export class KidSchoolModel
  extends Model<KidSchool, KidSchoolCreationAttributes>
  implements KidSchool
{
  public id!: string;
  public kid_id!: string;
  public school_id!: string;
  public created_at!: Date;
  public updated_at!: Date;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export default function (sequelize: Sequelize): typeof KidSchoolModel {
  KidSchoolModel.init(
    {
      id: {
        primaryKey: true,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
      },
      kid_id: {
        allowNull: false,
        type: DataTypes.UUID,
        references: {
          model: 'kids',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      school_id: {
        allowNull: false,
        type: DataTypes.UUID,
        references: {
          model: 'schools',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
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
      tableName: 'kid_schools',
      sequelize,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      timestamps: true,
      indexes: [
        {
          unique: true,
          fields: ['kid_id', 'school_id'],
        },
      ],
    },
  );

  return KidSchoolModel;
}
