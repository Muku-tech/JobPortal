const { sequelize, Message, User } = require("./models");
require("dotenv").config();

async function seedTestMessages() {
  try {
    await sequelize.sync({ alter: true });
    console.log("✅ DB synced");

    // Find or create users
    const users = await User.findAll({ limit: 5 });
    console.log(`Found ${users.length} users`);

    if (users.length === 0) {
      console.log("No users, create demo");
      // Fallback
    }

    // Create test messages for recipient_id = 1 (assume jobseeker)
    const testMessages = [
      {
        sender_id: 2, // assume employer
        recipient_id: 1,
        title: "Application Status Updated",
        content:
          "Your application for Software Engineer has been shortlisted! Interview scheduled.",
        type: "application_update",
      },
      {
        sender_id: 3,
        recipient_id: 1,
        title: "New Message from Acme Corp",
        content:
          "Hi, we received your resume. Can you join for interview tomorrow?",
        type: "message",
      },
      {
        sender_id: 4,
        recipient_id: 1,
        title: "Interview Request",
        content:
          "Interview scheduled for React Developer position. Please confirm.",
        type: "interview_request",
      },
    ];

    for (const msgData of testMessages) {
      const exists = await Message.findOne({ where: msgData });
      if (!exists) {
        await Message.create(msgData);
        console.log(`✅ Created: ${msgData.title}`);
      } else {
        console.log(`⏭️ Exists: ${msgData.title}`);
      }
    }

    const count = await Message.count({ where: { recipient_id: 1 } });
    console.log(`📊 Total messages for user 1: ${count}`);
    console.log("🎉 Seeding complete! Restart server and check Messages page.");
  } catch (error) {
    console.error("❌ Seed error:", error.message);
  } finally {
    await sequelize.close();
  }
}

seedTestMessages();
