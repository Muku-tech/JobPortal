const { Message, User } = require("../models");

const getMessages = async (req, res) => {
  try {
    console.log(`🔍 Fetching messages for recipient ID: ${req.user.id}`);

    const messages = await Message.findAll({
      where: { recipient_id: req.user.id },
      attributes: { exclude: ["applicant_read"] },
      include: [
        {
          model: User,
          as: "sender",
          required: false,
          attributes: ["id", "name", "email", "role"],
        },
      ],
      order: [["createdAt", "DESC"]],
      limit: 50,
    });

    console.log(`📊 Found ${messages.length} messages for user ${req.user.id}`);

    res.json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ message: "Error fetching messages" });
  }
};

const getUnreadCount = async (req, res) => {
  try {
    const count = await Message.count({
      where: {
        recipient_id: req.user.id,
        read: false,
      },
    });
    console.log(`📊 Unread count: ${count}`);
    res.json({ unreadCount: count });
  } catch (error) {
    console.error("Error fetching unread count:", error);
    res.status(500).json({ unreadCount: 0 });
  }
};

const getUnreadPerApp = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || id === "undefined") {
      return res.status(400).json({ unreadCount: 0 });
    }
    const appId = parseInt(id);
    if (isNaN(appId)) {
      return res.status(400).json({ unreadCount: 0 });
    }

    const count = await Message.count({
      where: {
        application_id: appId,
        sender_id: req.user.id,
        read: false,
      },
    });

    console.log(
      `📊 App ${appId} unread count for employer ${req.user.id}: ${count}`,
    );
    res.json({ unreadCount: count });
  } catch (error) {
    console.error("Error fetching app unread count:", error);
    res.status(500).json({ unreadCount: 0 });
  }
};

const markRead = async (req, res) => {
  try {
    const message = await Message.findOne({
      where: { id: req.params.id, recipient_id: req.user.id },
    });

    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    await message.update({ read: true });
    res.json({ message: "Message marked as read", message });
  } catch (error) {
    console.error("Error updating message:", error);
    res.status(500).json({ message: "Error updating message" });
  }
};

const markAllRead = async (req, res) => {
  try {
    const updated = await Message.update(
      { read: true },
      { where: { recipient_id: req.user.id, read: false } },
    );
    res.json({ message: `${updated} messages marked as read` });
  } catch (error) {
    console.error("Error updating messages:", error);
    res.status(500).json({ message: "Error updating messages" });
  }
};

const markAppAllRead = async (req, res) => {
  try {
    const { appId } = req.params;
    const updatedRead = await Message.update(
      { read: true },
      {
        where: {
          application_id: appId,
          recipient_id: req.user.id,
          read: false,
        },
      },
    );
    const updatedApplicantRead = await Message.update(
      { applicant_read: true },
      {
        where: {
          application_id: appId,
          sender_id: req.user.id,
          applicant_read: false,
        },
      },
    );
    res.json({
      message: `${updatedRead[0] + updatedApplicantRead[0]} messages marked as read`,
    });
  } catch (error) {
    console.error("Error updating app messages:", error);
    res.status(500).json({ message: "Error updating messages" });
  }
};

const sendMessage = async (req, res) => {
  try {
    const { recipientId, message: content } = req.body;

    const recipient = await User.findByPk(recipientId);
    if (!recipient) {
      return res.status(404).json({ message: "Recipient not found" });
    }

    const messageToRecipient = await Message.create({
      sender_id: req.user.id,
      recipient_id: recipientId,
      message: content,
      type: "message",
    });

    const messageToSender = await Message.create({
      sender_id: recipientId,
      recipient_id: req.user.id,
      message: `Message sent to ${recipient.name}`,
      type: "message",
    });

    console.log(
      `✅ Message sent from ${req.user.name} (${req.user.id}) to ${recipient.name} (${recipientId})`,
    );
    res.json({
      message: "Message sent successfully",
      toRecipient: messageToRecipient,
      copyToSender: messageToSender,
    });
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ message: "Error sending message" });
  }
};

const seedTestMessages = async (req, res) => {
  try {
    console.log("🌱 Creating test messages for user 1...");

    const testData = [
      {
        sender_id: 1,
        recipient_id: 1,
        title: "Application Shortlisted",
        message: "Your job application has been shortlisted! Check details.",
        type: "application_update",
        read: false,
      },
      {
        sender_id: 1,
        recipient_id: 1,
        title: "Interview Request",
        message: "Interview scheduled for tomorrow. Please confirm.",
        type: "interview_request",
        read: false,
      },
      {
        sender_id: 1,
        recipient_id: 1,
        title: "New Job Match",
        message: "New React Developer job matched your profile.",
        type: "message",
        read: false,
      },
    ];

    let created = 0;
    for (const data of testData) {
      const exists = await Message.findOne({ where: data });
      if (!exists) {
        await Message.create(data);
        created++;
      }
    }

    const count1 = await Message.count({ where: { recipient_id: 1 } });
    console.log(`✅ Added ${created} test messages. User 1 now has ${count1}`);
    res.json({ created, user1Count: count1 });
  } catch (error) {
    console.error("Seed error:", error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getMessages,
  getUnreadCount,
  getUnreadPerApp,
  markRead,
  markAllRead,
  sendMessage,
  seedTestMessages,
};
