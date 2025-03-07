import { Sequelize, DataTypes, Model, Optional } from 'sequelize';
import { KidMonthlySpending } from '@/interfaces';

export type KidMonthlySpendingCreationAttributes = Optional<
  KidMonthlySpending,
  'id' | 'created_at' | 'updated_at'
>;

export class KidMonthlySpendingModel
  extends Model<KidMonthlySpending, KidMonthlySpendingCreationAttributes>
  implements KidMonthlySpending
{
  public id!: string;
  public kid_id!: string;
  public year!: number;
  public month!: number;
  public spending_amount!: number;
  public created_at!: Date;
  public updated_at!: Date;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export default function (sequelize: Sequelize): typeof KidMonthlySpendingModel {
  KidMonthlySpendingModel.init(
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
      year: {
        allowNull: false,
        type: DataTypes.INTEGER,
      },
      month: {
        allowNull: false,
        type: DataTypes.INTEGER,
        validate: {
          min: 1,
          max: 12,
        },
      },
      spending_amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.0,
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
      tableName: 'kid_monthly_spendings',
      sequelize,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      timestamps: true,
      indexes: [
        {
          unique: true,
          fields: ['kid_id', 'year', 'month'],
          name: 'kid_monthly_spending_unique',
        },
      ],
    },
  );

  return KidMonthlySpendingModel;
}
