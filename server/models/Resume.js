const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Resume = sequelize.define('Resume', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    auto  },
  userIncrement: true
_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  personal_info: {
    type: DataTypes.JSON,
    defaultValue: {},
    comment: 'name, email, phone, address, linkedin, github'
  },
  summary: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  education: {
    type: DataTypes.JSON,
    defaultValue: [],
    comment: 'Array of education objects'
  },
  experience: {
    type: DataTypes.JSON,
    defaultValue: [],
    comment: 'Array of work experience'
  },
  skills: {
    type: DataTypes.JSON,
    defaultValue: [],
    comment: 'Array of skills'
  },
  projects: {
    type: DataTypes.JSON,
    defaultValue: [],
    comment: 'Array of projects'
  },
  template: {
    type: DataTypes.STRING(50),
    defaultValue: 'modern'
  },
  is_default: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'resumes',
  timestamps: true
});

module.exports = Resume;
