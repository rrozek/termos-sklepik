import { Sequelize, DataTypes, Model, Optional } from 'sequelize';
import { Product } from '@/interfaces';

export type ProductCreationAttributes = Optional<
  Product,
  'id' | 'created_at' | 'updated_at'
>;

export class ProductModel
  extends Model<Product, ProductCreationAttributes>
  implements Product
{
  public id!: string;
  public name!: string;
  public description?: string;
  public ingredients?: string;
  public barcode?: string;
  public image_url?: string;
  public price!: number;
  public product_group_id?: string;
  public is_active!: boolean;
  public created_at!: Date;
  public updated_at!: Date;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export default function (sequelize: Sequelize): typeof ProductModel {
  ProductModel.init(
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
      ingredients: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      barcode: {
        type: DataTypes.STRING(50),
        unique: true,
        allowNull: true,
      },
      image_url: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      product_group_id: {
        type: DataTypes.UUID,
        references: {
          model: 'product_groups',
          key: 'id',
        },
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
      tableName: 'products',
      sequelize,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      timestamps: true,
    },
  );

  return ProductModel;
}
