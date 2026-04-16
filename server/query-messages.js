const { sequelize, Message } = require("./models");
require("dotenv").config();

async function query() {
  try {
    const countAll = await Message.count();
    const countUser1 = await Message.count({ where: { recipient_id: 1 } });
    const unreadUser1 = await Message.count({
      where: { recipient_id: 1, read: false },
    });
    console.log(`📊 Total messages: ${countAll}`);
    console.log(`📊 User 1 messages: ${countUser1}`);
    console.log(`📊 User 1 unread: ${unreadUser1}`);

    const recent = await Message.findAll({
      where: { recipient_id: 1 },
      order: [["createdAt", "DESC"]],
      limit: 3,
    });
    console.log(
      "Recent for user 1:",
      recent.map((m) => ({
        title: m.title,
        read: m.read,
        createdAt: m.createdAt,
      })),
    );
  } catch (error) {
    console.error("Query error:", error.message);
  } finally {
    await sequelize.close();
  }
}

query();
