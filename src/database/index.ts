import logger from '@/utils/logger';
import Sequelize from 'sequelize';
import userModel from './models/user.model';
import kidModel from './models/kid.model';
import productGroupModel from './models/product-group.model';
import productModel from './models/product.model';
import orderModel from './models/order.model';
import orderItemModel from './models/order-item.model';
import discountModel from './models/discount.model';
import {
  DB_DIALECT,
  DB_HOST,
  DB_NAME,
  DB_PASSWORD,
  DB_PORT,
  DB_USERNAME,
  NODE_ENV,
} from '@/config';

const sequelize = new Sequelize.Sequelize(
  DB_NAME as string,
  DB_USERNAME as string,
  DB_PASSWORD,
  {
    dialect: (DB_DIALECT as Sequelize.Dialect) || 'postgres',
    host: DB_HOST,
    port: parseInt(DB_PORT as string, 10),
    timezone: '+00:00',
    define: {
      charset: 'utf8mb4',
      collate: 'utf8mb4_general_ci',
      underscored: true,
      freezeTableName: true,
    },
    pool: {
      min: 0,
      max: 5,
    },
    logQueryParameters: NODE_ENV === 'development',
    logging: (query, time) => {
      logger.info(time + 'ms' + ' ' + query);
    },
    benchmark: true,
  },
);

sequelize.authenticate();

// Initialize models
const Users = userModel(sequelize);
const Kids = kidModel(sequelize);
const ProductGroups = productGroupModel(sequelize);
const Products = productModel(sequelize);
const Orders = orderModel(sequelize);
const OrderItems = orderItemModel(sequelize);
const Discounts = discountModel(sequelize);

// Define associations
Users.hasMany(Kids, { foreignKey: 'parent_id', as: 'kids' });
Kids.belongsTo(Users, { foreignKey: 'parent_id', as: 'parent' });

ProductGroups.hasMany(Products, {
  foreignKey: 'product_group_id',
  as: 'products',
});
Products.belongsTo(ProductGroups, {
  foreignKey: 'product_group_id',
  as: 'product_group',
});

Users.hasMany(Orders, { foreignKey: 'parent_id', as: 'orders' });
Orders.belongsTo(Users, { foreignKey: 'parent_id', as: 'parent' });

Kids.hasMany(Orders, { foreignKey: 'kid_id', as: 'orders' });
Orders.belongsTo(Kids, { foreignKey: 'kid_id', as: 'kid' });

Orders.hasMany(OrderItems, { foreignKey: 'order_id', as: 'order_items' });
OrderItems.belongsTo(Orders, { foreignKey: 'order_id', as: 'order' });

Products.hasMany(OrderItems, { foreignKey: 'product_id', as: 'order_items' });
OrderItems.belongsTo(Products, { foreignKey: 'product_id', as: 'product' });

export const DB = {
  Users,
  Kids,
  ProductGroups,
  Products,
  Orders,
  OrderItems,
  Discounts,
  sequelize, // connection instance (RAW queries)
  Sequelize, // library
};
