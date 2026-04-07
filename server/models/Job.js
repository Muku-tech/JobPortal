const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Job = sequelize.define(
  "Job",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    employer_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    company_name: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    company_logo: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    location: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    job_type: {
      type: DataTypes.ENUM("full-time", "part-time", "contract", "internship"),
      defaultValue: "full-time",
    },
    category: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    salary_min: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    salary_max: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    salary_currency: {
      type: DataTypes.STRING(10),
      defaultValue: "NPR",
    },
    required_skills: {
      type: DataTypes.TEXT,
      allowNull: true,
      get() {
        const raw = this.getDataValue("required_skills");
        return raw ? JSON.parse(raw) : [];
      },
      set(value) {
        this.setDataValue("required_skills", JSON.stringify(value || []));
      },
    },
    experience_level: {
      type: DataTypes.ENUM("entry", "mid", "senior", "lead", "executive"),
      allowNull: true,
    },
    education_level: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM("active", "draft", "closed", "completed"),
      defaultValue: "active",
    },
    vacancy: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },
    deadline: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    benefits: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "jobs",
    timestamps: true,
  },
);

Job.associate = (models) => {
  Job.belongsTo(models.User, { foreignKey: "employer_id", as: "employer" });
  Job.hasMany(models.Application, { foreignKey: "job_id", as: "applications" });
};

module.exports = Job;
