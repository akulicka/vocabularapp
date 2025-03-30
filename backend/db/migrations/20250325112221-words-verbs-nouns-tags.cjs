'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('tags', {
      tagId: {
        primaryKey: true,
        allowNull: false,
        type: Sequelize.STRING
      },
      tagName: {
        type: Sequelize.STRING
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
    await queryInterface.createTable('words', {
      wordId: {
        primaryKey: true,
        allowNull: false,
        type: Sequelize.STRING
      },
      english: {
        type: Sequelize.STRING
      },
      arabic: {
        type: Sequelize.STRING
      },
      root: {
        type: Sequelize.STRING
      },
      partOfSpeech: {
        type: Sequelize.STRING
      },
      img: {
        type: Sequelize.STRING
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      createdBy: {
        allowNull: false,
        type: Sequelize.STRING,
        references: {
          model: {
            tableName: 'users',
          },
          key: 'userId',
        },
      }
    });
    await queryInterface.createTable('nouns', {
      wordId: {
        type: Sequelize.STRING,
        allowNull: false,
        primaryKey: true,
        references: {
          model: {
            tableName: 'words',
          },
          key: 'wordId',
        },
      },
      nounType: {
        type: Sequelize.STRING
      },
      gender: {
        type: Sequelize.STRING
      },
      brokenPlural: {
        type: Sequelize.STRING
      },
    });
    await queryInterface.createTable('verbs', {
      wordId: {
        type: Sequelize.STRING,
        primaryKey: true,
        allowNull: false,
        references: {
          model: {
            tableName: 'words',
          },
          key: 'wordId',
        },
      },
      verbform: {
        type: Sequelize.STRING
      },
      irregularityClass: {
        type: Sequelize.STRING
      },
      tense: {
        type: Sequelize.STRING
      },
    });
    await queryInterface.createTable('tagwords', {
      wordId: {
        type: Sequelize.STRING,
        allowNull: false,
        primaryKey: true,
        references: {
          model: {
            tableName: 'words',
          },
          key: 'wordId',
        },
      },
      tagId: {
        type: Sequelize.STRING,
        allowNull: false,
        primaryKey: true,
        references: {
          model: {
            tableName: 'tags',
          },
          key: 'tagId',
        },
      },
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('tagwords');
    await queryInterface.dropTable('verbs');
    await queryInterface.dropTable('nouns');
    await queryInterface.dropTable('words');
    await queryInterface.dropTable('tags');
  }
};
