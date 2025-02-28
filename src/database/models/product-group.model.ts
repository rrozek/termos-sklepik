import { Sequelize, DataTypes, Model, Optional } from 'sequelize';
import { ProductGroup } from '@/interfaces';

export type ProductGroupCreationAttributes = Optional<
  ProductGroup,
  'id' | 'created_at' | 'updated_at'
>;

export class ProductGroupModel
  extends Model<ProductGroup, ProductGroupCreationAttributes>
  implements ProductGroup
{
  public id!: string;
  public name!: string;
  public description?: string;
  public is_active!: boolean;
  public created_at!: Date;
  public updated_at!: Date;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export default function (sequelize: Sequelize): typeof ProductGroupModel {
  ProductGroupModel.init(
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
      description: {
        type: DataTypes.TEXT,
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
      tableName: 'product_groups',
      sequelize,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      timestamps: true,
    },
  );

  return ProductGroupModel;
}
