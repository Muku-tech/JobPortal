const { Notification, User } = require("../models");

const getNotifications = async (req, res) => {
  try {
    console.log(`🔍 Fetching notifications for user ID: ${req.user.id}`);
    console.log(`🔍 User object:`, req.user);

    const notifications = await Notification.findAll({
      where: { user_id: req.user.id },
      include: [
        {
          model: User,
          as: "sender",
          attributes: ["id", "name"],
          required: false,
        },
      ],
      order: [["createdAt", "DESC"]],
      limit: 50,
    });

    console.log(
      `📊 Found ${notifications.length} notifications for user ${req.user.id}`,
    );
    console.log(`📋 First notification:`, notifications[0]);

    res.json(notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ message: "Error fetching notifications" });
  }
};

const markRead = async (req, res) => {
  try {
    const notification = await Notification.findOne({
      where: { id: req.params.id, user_id: req.user.id },
    });

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    await notification.update({ read: true });
    res.json({ message: "Notification marked as read", notification });
  } catch (error) {
    console.error("Error updating notification:", error);
    res.status(500).json({ message: "Error updating notification" });
  }
};

const markAllRead = async (req, res) => {
  try {
    const updated = await Notification.update(
      { read: true },
      { where: { user_id: req.user.id, read: false } },
    );
    res.json({ message: `${updated} notifications marked as read` });
  } catch (error) {
    console.error("Error updating notifications:", error);
    res.status(500).json({ message: "Error updating notifications" });
  }
};

const sendMessage = async (req, res) => {
  try {
    const { applicantId, title, message } = req.body;

    const applicant = await User.findByPk(applicantId);
    if (!applicant) {
      return res.status(404).json({ message: "Applicant not found" });
    }

    const notification = await Notification.create({
      user_id: applicantId,
      from_user_id: req.user.id,
      title: title || "New Message",
      message,
      type: "message",
    });

    await Notification.create({
      user_id: req.user.id,
      from_user_id: applicantId,
      title: "Message Sent",
      message: `Your message to ${applicant.name} has been sent.`,
      type: "message_sent",
    });

    console.log(`✅ Message sent from ${req.user.name} to ${applicant.name}`);
    res.json({ message: "Message sent successfully", notification });
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ message: "Error sending message" });
  }
};

const getUnreadCount = async (req, res) => {
  try {
    console.log(`🔍 Unread count for user ${req.user.id}`);
    const count = await Notification.count({
      where: {
        user_id: req.user.id,
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

module.exports = {
  getNotifications,
  markRead,
  markAllRead,
  sendMessage,
  getUnreadCount,
};
