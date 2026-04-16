const { sequelize } = require("./config/database");
const models = require("./models");
const { User, Notification, Message } = models;

const migrate = async () => {
  const transaction = await sequelize.transaction();
  try {
    console.log("🔄 Starting migration from notifications to messages...");

    await sequelize.sync({ alter: true }); // Ensure tables exist

    // Filter notifications (exclude job_posted/system/saved jobs)
    const notifications = await Notification.findAll({
      where: {
        type: {
          [require("sequelize").Op.in]: [
            "application",
            "interview",
            "status_update",
          ],
        },
      },
      include: [{ model: User, as: "sender" }],
      transaction,
    });

    console.log(`📊 Found ${notifications.length} notifications to migrate`);

    let migratedCount = 0;
    for (const notif of notifications) {
      await Message.create(
        {
          sender_id: notif.from_user_id || 1,
          recipient_id: notif.user_id,
          title: notif.title,
          content: notif.message,
          read: notif.read || false,
          type: "application_update",
        },
        { transaction },
      );

      migratedCount++;
    }

    await transaction.commit();
    console.log(`🎉 Migration complete! ${migratedCount} messages created`);
  } catch (error) {
    await transaction.rollback();
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
};

migrate();
