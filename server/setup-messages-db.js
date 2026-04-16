const mysql = require("mysql2/promise");

async function setup() {
  const connection = await mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "", // add your password
    database: "jobportal_nepal",
  });

  try {
    // Create messages table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        sender_id INT NOT NULL,
        recipient_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        \`read\` BOOLEAN DEFAULT FALSE,
        \`type\` ENUM('message', 'application_update', 'interview_request') DEFAULT 'message',
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_recipient_read (recipient_id, \`read\`),
        INDEX idx_sender (sender_id)
      )
    `);

    // Copy data (exclude saved jobs)
    const [result] = await connection.execute(`
      INSERT IGNORE INTO messages (sender_id, recipient_id, title, content, \`read\`, \`type\`, createdAt, updatedAt)
      SELECT 
        COALESCE(from_user_id, 1), user_id, title, message, \`read\`, 'application_update', createdAt, updatedAt
      FROM notifications 
      WHERE \`type\` IN ('application', 'interview', 'status_update')
    `);

    console.log(
      `✅ Messages table ready! Copied ${result.affectedRows || 0} records`,
    );
  } catch (error) {
    console.error("❌ Setup failed:", error.message);
  } finally {
    await connection.end();
  }
}

setup();
