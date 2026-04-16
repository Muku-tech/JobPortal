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
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    read: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    type: {
      type: DataTypes.ENUM(
        "message",
        "application_update",
        "interview_request",
        "sent",
      ),
      defaultValue: "message",
    },
  },
  {
    tableName: "messages",
    timestamps: true,
    indexes: [
      {
        fields: ["recipient_id", "read", "createdAt"],
      },
      {
        fields: ["sender_id"],
      },
    ],
  },
);

Message.associate = (models) => {
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
