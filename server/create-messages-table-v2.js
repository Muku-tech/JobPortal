const { sequelize } = require("./config/database");

async function createMessagesTable() {
  try {
    console.log("🛠️ Creating messages table with updated schema...");

    // Drop if exists (careful!)
    await sequelize.query("DROP TABLE IF EXISTS messages");
    console.log("🗑️ Dropped existing messages table");

    await sequelize.query(`
      CREATE TABLE messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        application_id INT NULL,
        sender_id INT NOT NULL,
        recipient_id INT NOT NULL,
        message TEXT NOT NULL,
        type ENUM('system', 'user') DEFAULT 'system',
        read BOOLEAN DEFAULT false,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_recipient (recipient_id),
        INDEX idx_app_read (application_id, read, createdAt),
        FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE SET NULL,
        FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    console.log("✅ Messages table created with nullable application_id!");
  } catch (error) {
    console.error("❌ Failed to create table:", error.message);
  } finally {
    await sequelize.close();
  }
}

createMessagesTable();
