'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Create UUID extension if it doesn't exist (for PostgreSQL)
    await queryInterface.sequelize.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');

    // Create users table
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('uuid_generate_v4()'),
        primaryKey: true,
      },
      email: {
        type: Sequelize.STRING(45),
        allowNull: false,
        unique: true,
      },
      password: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      role: {
        type: Sequelize.ENUM('admin', 'parent', 'staff'),
        defaultValue: 'parent',
        allowNull: false,
      },
      portal_user_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    // Create kids table
    await queryInterface.createTable('kids', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('uuid_generate_v4()'),
        primaryKey: true,
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      parent_id: {
        type: Sequelize.UUID,
        references: {
          model: 'users',
          key: 'id',
        },
        allowNull: false,
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      rfid_token: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        defaultValue: [],
      },
      monthly_spending_limit: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0.00,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    // Create product_groups table
    await queryInterface.createTable('product_groups', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('uuid_generate_v4()'),
        primaryKey: true,
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    // Create products table
    await queryInterface.createTable('products', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('uuid_generate_v4()'),
        primaryKey: true,
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      ingredients: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      barcode: {
        type: Sequelize.STRING(50),
        unique: true,
        allowNull: true,
      },
      image_url: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      product_group_id: {
        type: Sequelize.UUID,
        references: {
          model: 'product_groups',
          key: 'id',
        },
        allowNull: true,
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    // Create discounts table with enums
    await queryInterface.sequelize.query('CREATE TYPE discount_type_enum AS ENUM (\'percentage\', \'fixed_amount\', \'buy_x_get_y\', \'bundle\');');

    await queryInterface.sequelize.query('CREATE TYPE discount_target_enum AS ENUM (\'product\', \'product_group\', \'order\', \'user\', \'kid\');');

    await queryInterface.createTable('discounts', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('uuid_generate_v4()'),
        primaryKey: true,
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      discount_type: {
        type: 'discount_type_enum',
        allowNull: false,
        defaultValue: 'percentage',
      },
      discount_value: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        comment: 'Percentage or fixed amount depending on discount_type',
      },
      target_type: {
        type: 'discount_target_enum',
        allowNull: false,
        defaultValue: 'product_group',
      },
      target_id: {
        type: Sequelize.UUID,
        allowNull: true,
        comment: 'ID of the target (product, product_group, etc.)',
      },
      start_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      end_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      start_time: {
        type: Sequelize.STRING(5),
        allowNull: true,
        comment: 'Time in 24-hour format (HH:MM)',
      },
      end_time: {
        type: Sequelize.STRING(5),
        allowNull: true,
        comment: 'Time in 24-hour format (HH:MM)',
      },
      monday_enabled: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      tuesday_enabled: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      wednesday_enabled: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      thursday_enabled: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      friday_enabled: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      saturday_enabled: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      sunday_enabled: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      minimum_purchase_amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
        comment: 'Minimum purchase amount to apply discount',
      },
      minimum_quantity: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Minimum quantity required to apply discount',
      },
      buy_quantity: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Number of items to buy for buy X get Y promotion',
      },
      get_quantity: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Number of items to get free for buy X get Y promotion',
      },
      is_stackable: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        comment: 'Whether this discount can be combined with others',
      },
      priority: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        comment: 'Priority for applying non-stackable discounts (higher = applied first)',
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    // Create orders table
    await queryInterface.createTable('orders', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('uuid_generate_v4()'),
        primaryKey: true,
      },
      kid_id: {
        type: Sequelize.UUID,
        references: {
          model: 'kids',
          key: 'id',
        },
        allowNull: false,
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      parent_id: {
        type: Sequelize.UUID,
        references: {
          model: 'users',
          key: 'id',
        },
        allowNull: false,
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      total_amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM('pending', 'completed', 'canceled'),
        defaultValue: 'pending',
        allowNull: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    // Create order_items table
    await queryInterface.createTable('order_items', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('uuid_generate_v4()'),
        primaryKey: true,
      },
      order_id: {
        type: Sequelize.UUID,
        references: {
          model: 'orders',
          key: 'id',
        },
        allowNull: false,
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      product_id: {
        type: Sequelize.UUID,
        references: {
          model: 'products',
          key: 'id',
        },
        allowNull: false,
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      product_name: {
        type: Sequelize.STRING(100),
        allowNull: false,
        comment: 'Store the product name at time of purchase to preserve history',
      },
      quantity: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
      unit_price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        comment: 'Price per item at time of purchase',
      },
      total_price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        comment: 'Total price after quantity and discounts',
      },
      discount_applied: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
        comment: 'Discount amount applied (if any)',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    // Create indexes for better performance
    await queryInterface.addIndex('users', ['email']);
    await queryInterface.addIndex('users', ['portal_user_id']);
    await queryInterface.addIndex('users', ['role']);

    await queryInterface.addIndex('kids', ['parent_id']);
    await queryInterface.addIndex('kids', ['rfid_token']);

    await queryInterface.addIndex('products', ['barcode']);
    await queryInterface.addIndex('products', ['product_group_id']);

    await queryInterface.addIndex('discounts', ['target_type', 'target_id']);
    await queryInterface.addIndex('discounts', ['is_active']);
    await queryInterface.addIndex('discounts', ['discount_type']);
    await queryInterface.addIndex('discounts', ['start_date', 'end_date']);

    await queryInterface.addIndex('orders', ['kid_id']);
    await queryInterface.addIndex('orders', ['parent_id']);
    await queryInterface.addIndex('orders', ['created_at']);
    await queryInterface.addIndex('orders', ['status']);

    await queryInterface.addIndex('order_items', ['order_id']);
    await queryInterface.addIndex('order_items', ['product_id']);
  },

  async down(queryInterface, Sequelize) {
    // Drop tables in reverse order to avoid foreign key constraint errors
    await queryInterface.dropTable('order_items');
    await queryInterface.dropTable('orders');
    await queryInterface.dropTable('discounts');
    await queryInterface.dropTable('products');
    await queryInterface.dropTable('product_groups');
    await queryInterface.dropTable('kids');
    await queryInterface.dropTable('users');

    // Drop enums
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS discount_type_enum;');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS discount_target_enum;');
  }
};