import { Sequelize, DataTypes, Model, Optional } from 'sequelize';
import { Discount } from '@/interfaces';

export type DiscountCreationAttributes = Optional<
  Discount,
  'id' | 'created_at' | 'updated_at'
>;

export enum DiscountType {
  PERCENTAGE = 'percentage',
  FIXED_AMOUNT = 'fixed_amount',
  BUY_X_GET_Y = 'buy_x_get_y',
  BUNDLE = 'bundle',
}

export enum DiscountTarget {
  PRODUCT = 'product',
  PRODUCT_GROUP = 'product_group',
  ORDER = 'order',
  USER = 'user',
  KID = 'kid',
}

export class DiscountModel
  extends Model<Discount, DiscountCreationAttributes>
  implements Discount
{
  public id!: string;
  public name!: string;
  public description?: string;
  public discount_type!: DiscountType;
  public discount_value!: number;
  public target_type!: DiscountTarget;
  public target_id?: string;

  // Time-based restrictions
  public start_date?: Date;
  public end_date?: Date;
  public start_time?: string; // HH:MM format
  public end_time?: string; // HH:MM format

  // Day-based restrictions
  public monday_enabled?: boolean;
  public tuesday_enabled?: boolean;
  public wednesday_enabled?: boolean;
  public thursday_enabled?: boolean;
  public friday_enabled?: boolean;
  public saturday_enabled?: boolean;
  public sunday_enabled?: boolean;

  // Special conditions
  public minimum_purchase_amount?: number;
  public minimum_quantity?: number;
  public buy_quantity?: number; // For buy X get Y
  public get_quantity?: number; // For buy X get Y

  // Stackable with other discounts?
  public is_stackable?: boolean;

  // Priority for calculating non-stackable discounts
  public priority?: number;

  public is_active!: boolean;
  public created_at!: Date;
  public updated_at!: Date;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export default function (sequelize: Sequelize): typeof DiscountModel {
  DiscountModel.init(
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
      discount_type: {
        allowNull: false,
        type: DataTypes.ENUM(...Object.values(DiscountType)),
        defaultValue: DiscountType.PERCENTAGE,
      },
      discount_value: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        comment: 'Percentage or fixed amount depending on discount_type',
      },
      target_type: {
        allowNull: false,
        type: DataTypes.ENUM(...Object.values(DiscountTarget)),
        defaultValue: DiscountTarget.PRODUCT_GROUP,
      },
      target_id: {
        type: DataTypes.UUID,
        allowNull: true,
        comment: 'ID of the target (product, product_group, etc.)',
      },
      start_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      end_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      start_time: {
        type: DataTypes.STRING(5),
        allowNull: true,
        comment: 'Time in 24-hour format (HH:MM)',
        validate: {
          is: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
        },
      },
      end_time: {
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
        defaultValue: true,
      },
      sunday_enabled: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      minimum_purchase_amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        comment: 'Minimum purchase amount to apply discount',
      },
      minimum_quantity: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Minimum quantity required to apply discount',
      },
      buy_quantity: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Number of items to buy for buy X get Y promotion',
      },
      get_quantity: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Number of items to get free for buy X get Y promotion',
      },
      is_stackable: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: 'Whether this discount can be combined with others',
      },
      priority: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment:
          'Priority for applying non-stackable discounts (higher = applied first)',
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
      tableName: 'discounts',
      sequelize,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      timestamps: true,
    },
  );

  return DiscountModel;
}
