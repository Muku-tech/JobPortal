const { sequelize } = require("./config/database");

async function createTable() {
  try {
    await sequelize.getQueryInterface().createTable("messages", {
      id: {
        type: sequelize.DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      sender_id: {
        type: sequelize.DataTypes.INTEGER,
        allowNull: false,
      },
      recipient_id: {
        type: sequelize.DataTypes.INTEGER,
        allowNull: false,
      },
      title: {
        type: sequelize.DataTypes.STRING(255),
        allowNull: false,
      },
      content: {
        type: sequelize.DataTypes.TEXT,
        allowNull: false,
      },
      read: {
        type: sequelize.DataTypes.BOOLEAN,
        defaultValue: false,
      },
      type: {
        type: sequelize.DataTypes.ENUM(
          "message",
          "application_update",
          "interview_request",
        ),
        defaultValue: "message",
      },
      createdAt: {
        type: sequelize.DataTypes.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: sequelize.DataTypes.DATE,
        allowNull: false,
      },
    });

    console.log("✅ Messages table created successfully!");
  } catch (error) {
    if (error.message.includes("table already exists")) {
      console.log("ℹ️ Messages table already exists");
    } else {
      console.error("❌ Failed to create table:", error.message);
    }
  }
}

createTable();
