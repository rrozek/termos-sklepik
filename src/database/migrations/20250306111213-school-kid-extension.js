'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Create schools table
    await queryInterface.createTable('schools', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('uuid_generate_v4()'),
        primaryKey: true,
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      address: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      city: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      postal_code: {
        type: Sequelize.STRING(20),
        allowNull: true,
      },
      contact_email: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      contact_phone: {
        type: Sequelize.STRING(20),
        allowNull: true,
      },
      opening_hour: {
        type: Sequelize.STRING(5),
        allowNull: true,
        comment: 'Time in 24-hour format (HH:MM)',
      },
      closing_hour: {
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
        defaultValue: false,
      },
      sunday_enabled: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
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

    // Create indexes for schools
    await queryInterface.addIndex('schools', ['name']);
    await queryInterface.addIndex('schools', ['city']);
    await queryInterface.addIndex('schools', ['is_active']);

    // Create kid_schools table (association table)
    await queryInterface.createTable('kid_schools', {
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
        onDelete: 'CASCADE',
      },
      school_id: {
        type: Sequelize.UUID,
        references: {
          model: 'schools',
          key: 'id',
        },
        allowNull: false,
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
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

    // Create indexes for kid_schools
    await queryInterface.addIndex('kid_schools', ['kid_id']);
    await queryInterface.addIndex('kid_schools', ['school_id']);
    await queryInterface.addIndex('kid_schools', ['kid_id', 'school_id'], {
      unique: true,
    });
  },

  async down(queryInterface, Sequelize) {
    // Drop tables in reverse order
    await queryInterface.dropTable('kid_schools');
    await queryInterface.dropTable('schools');
  }
};
