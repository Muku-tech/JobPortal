const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Message = sequelize.define(
  "Message",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    application_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "applications",
        key: "id",
      },
    },
    sender_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
    },
    recipient_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM("system", "user"),
      defaultValue: "system",
    },
    read: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    tableName: "messages",
    timestamps: true,
    indexes: [
      {
        fields: ["application_id", "read", "createdAt"],
      },
      {
        fields: ["recipient_id"],
      },
    ],
  },
);

Message.associate = (models) => {
  Message.belongsTo(models.Application, {
    foreignKey: "application_id",
  });
  Message.belongsTo(models.User, {
    foreignKey: "sender_id",
    as: "sender",
  });
  Message.belongsTo(models.User, {
    foreignKey: "recipient_id",
    as: "recipient",
  });
};

module.exports = Message;
