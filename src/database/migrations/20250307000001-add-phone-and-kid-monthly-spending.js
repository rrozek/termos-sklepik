'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * Add phone column to users table
     */
    await queryInterface.addColumn('users', 'phone', {
      type: Sequelize.STRING(20),
      allowNull: true,
    });

    /**
     * Create kid_monthly_spendings table
     */
    await queryInterface.createTable('kid_monthly_spendings', {
      id: {
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
      },
      kid_id: {
        allowNull: false,
        type: Sequelize.UUID,
        references: {
          model: 'kids',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      year: {
        allowNull: false,
        type: Sequelize.INTEGER,
      },
      month: {
        allowNull: false,
        type: Sequelize.INTEGER,
        validate: {
          min: 1,
          max: 12,
        },
      },
      spending_amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.0,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });

    /**
     * Add unique constraint for kid_id, year, month
     */
    await queryInterface.addConstraint('kid_monthly_spendings', {
      fields: ['kid_id', 'year', 'month'],
      type: 'unique',
      name: 'kid_monthly_spending_unique',
    });
  },

  async down(queryInterface, Sequelize) {
    /**
     * Drop kid_monthly_spendings table
     */
    await queryInterface.dropTable('kid_monthly_spendings');

    /**
     * Remove phone column from users table
     */
    await queryInterface.removeColumn('users', 'phone');
  },
};
