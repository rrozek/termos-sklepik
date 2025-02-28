import { Sequelize, DataTypes, Model, Optional } from 'sequelize';
import { OrderItem } from '@/interfaces';

export type OrderItemCreationAttributes = Optional<
  OrderItem,
  'id' | 'created_at' | 'updated_at'
>;

export class OrderItemModel
  extends Model<OrderItem, OrderItemCreationAttributes>
  implements OrderItem
{
  public id!: string;
  public order_id!: string;
  public product_id!: string;
  public product_name!: string;
  public quantity!: number;
  public unit_price!: number;
  public total_price!: number;
  public discount_applied?: number;
  public created_at!: Date;
  public updated_at!: Date;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export default function (sequelize: Sequelize): typeof OrderItemModel {
  OrderItemModel.init(
    {
      id: {
        primaryKey: true,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
      },
      order_id: {
        allowNull: false,
        type: DataTypes.UUID,
        references: {
          model: 'orders',
          key: 'id',
        },
      },
      product_id: {
        allowNull: false,
        type: DataTypes.UUID,
        references: {
          model: 'products',
          key: 'id',
        },
      },
      product_name: {
        allowNull: false,
        type: DataTypes.STRING(100),
        comment:
          'Store the product name at time of purchase to preserve history',
      },
      quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
      unit_price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        comment: 'Price per item at time of purchase',
      },
      total_price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        comment: 'Total price after quantity and discounts',
      },
      discount_applied: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        comment: 'Discount amount applied (if any)',
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
      tableName: 'order_items',
      sequelize,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      timestamps: true,
    },
  );

  return OrderItemModel;
}
