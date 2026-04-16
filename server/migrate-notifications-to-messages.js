const { sequelize, User } = require("./config/database");
const { Notification } = require("./models/Notification");
const { Message } = require("./models/Message");

const migrate = async () => {
  const transaction = await sequelize.transaction();
  try {
    console.log("🔄 Starting migration from notifications to messages...");

    // Create messages table if not exists (sequelize.sync will handle)
    await sequelize.sync({ force: false });

    // Get all notifications (exclude saved jobs - assuming type != 'job_posted' or 'system')
    const notifications = await Notification.findAll({
      where: {
        type: ["application", "interview", "status_update"], // exclude saved jobs/system
      },
      include: ["sender"],
      transaction,
    });

    console.log(`📊 Found ${notifications.length} notifications to migrate`);

    for (const notif of notifications) {
      // Message to recipient
      await Message.create(
        {
          sender_id: notif.from_user_id || 1, // default system sender if missing
          recipient_id: notif.user_id,
          title: notif.title,
          content: notif.message,
          read: notif.read,
          type: "application_update", // map types
        },
        { transaction },
      );

      console.log(`✅ Migrated notification ${notif.id} to messages`);
    }

    await transaction.commit();
    console.log("🎉 Migration complete!");

    // Optional: Drop notifications table
    // await sequelize.getQueryInterface().dropTable('notifications');
    // console.log('🗑️ Dropped notifications table');
  } catch (error) {
    await transaction.rollback();
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
};

migrate();
