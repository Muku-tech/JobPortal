const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Notification = sequelize.define(
  "Notification",
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
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM(
        "application",
        "interview",
        "status_update",
        "job_posted",
        "system",
      ),
      defaultValue: "system",
    },
    from_user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "users",
        key: "id",
      },
    },
    read: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    tableName: "notifications",
    timestamps: true,
  },
);

Notification.associate = (models) => {
  Notification.belongsTo(models.User, {
    foreignKey: "user_id",
    as: "recipient",
  });
  Notification.belongsTo(models.User, {
    foreignKey: "from_user_id",
    as: "sender",
  });
};

module.exports = Notification;
