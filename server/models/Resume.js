const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");
const User = require("./User");

const Resume = sequelize.define(
  "Resume",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    personal_info: {
      type: DataTypes.JSON,
      defaultValue: {},
    },
    summary: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    skills: {
      type: DataTypes.JSON,
      defaultValue: [],
    },
    technical_skills: {
      type: DataTypes.JSON,
      defaultValue: [],
    },
    experiences: {
      type: DataTypes.JSON,
      defaultValue: [],
    },
    educations: {
      type: DataTypes.JSON,
      defaultValue: [],
    },
    projects: {
      type: DataTypes.JSON,
      defaultValue: [],
    },
    certifications: {
      type: DataTypes.JSON,
      defaultValue: [],
    },
    achievements: {
      type: DataTypes.JSON,
      defaultValue: [],
    },
    internships: {
      type: DataTypes.JSON,
      defaultValue: [],
    },
    publications: {
      type: DataTypes.JSON,
      defaultValue: [],
    },
    volunteer_experience: {
      type: DataTypes.JSON,
      defaultValue: [],
    },
    leadership_experience: {
      type: DataTypes.JSON,
      defaultValue: [],
    },
    extracurricular_activities: {
      type: DataTypes.JSON,
      defaultValue: [],
    },
    languages: {
      type: DataTypes.JSON,
      defaultValue: [],
    },
    interests: {
      type: DataTypes.JSON,
      defaultValue: [],
    },
    affiliations: {
      type: DataTypes.JSON,
      defaultValue: [],
    },
    conferences: {
      type: DataTypes.JSON,
      defaultValue: [],
    },
    template: {
      type: DataTypes.STRING(50),
      defaultValue: "modern",
    },
    font_family: {
      type: DataTypes.STRING(100),
      defaultValue: "Arial, sans-serif",
    },
    primary_color: {
      type: DataTypes.STRING(7),
      defaultValue: "#2c3e50",
    },
    secondary_color: {
      type: DataTypes.STRING(7),
      defaultValue: "#3498db",
    },
    is_default: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    tableName: "resumes",
    timestamps: true,
  },
);

Resume.associate = (models) => {
  Resume.belongsTo(models.User, { foreignKey: "user_id" });
};

module.exports = Resume;
