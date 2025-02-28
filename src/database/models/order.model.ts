import { Sequelize, DataTypes, Model, Optional } from 'sequelize';
import { Order } from '@/interfaces';

export type OrderCreationAttributes = Optional<
  Order,
  'id' | 'created_at' | 'updated_at'
>;

export class OrderModel
  extends Model<Order, OrderCreationAttributes>
  implements Order
{
  public id!: string;
  public kid_id!: string;
  public parent_id!: string;
  public total_amount!: number;
  public created_at!: Date;
  public updated_at!: Date;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export default function (sequelize: Sequelize): typeof OrderModel {
  OrderModel.init(
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
      },
      parent_id: {
        allowNull: false,
        type: DataTypes.UUID,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      total_amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
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
      tableName: 'orders',
      sequelize,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      timestamps: true,
    },
  );

  return OrderModel;
}
