const { Sequelize } = require("sequelize");
require("dotenv").config();

const sequelize = new Sequelize(
  process.env.DB_NAME || "jobportal_nepal",
  process.env.DB_USER || "root",
  process.env.DB_PASSWORD || "",
  {
    host: process.env.DB_HOST || "localhost",
    dialect: "mysql",
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  },
);

const connectDB = async () => {
  try {
    await sequelize.authenticate();

    // Check and create job_views table if missing
    const [tables] = await sequelize.query(
      `
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'job_views'
    `,
      { replacements: [sequelize.config.database] },
    );

    if (tables.length === 0) {
      console.log("⚠️ job_views table missing, creating...");
      await sequelize.query(`
        CREATE TABLE job_views (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          job_id INT NOT NULL,
          view_duration INT DEFAULT 0,
          action_type VARCHAR(50) DEFAULT 'view',
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          UNIQUE KEY unique_user_job (user_id, job_id),
          KEY idx_user_id (user_id),
          KEY idx_job_id (job_id),
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);
      console.log("✅ job_views table created");
    } else {
      console.log("✅ job_views table exists");
    }

    // Check and create messages table if missing
    const [messageTables] = await sequelize.query(
      `
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'messages'
    `,
      { replacements: [sequelize.config.database] },
    );

    if (messageTables.length === 0) {
      console.log("⚠️ messages table missing, creating...");
      await sequelize.query(`
        CREATE TABLE messages (
          id INT AUTO_INCREMENT PRIMARY KEY,
          application_id INT NULL,
          sender_id INT NOT NULL,
          recipient_id INT NOT NULL,
          message TEXT NOT NULL,
          \`type\` ENUM('system', 'user') DEFAULT 'system',
          \`read\` BOOLEAN DEFAULT false,
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_recipient (recipient_id),
          INDEX idx_app_read (application_id, \`read\`, createdAt),
          FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE SET NULL,
          FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);
      console.log("✅ messages table created");
    } else {
      console.log("✅ messages table exists");
    }

    console.log(
      "✅ Database authenticated (sync skipped to avoid FK drop issues - tables exist)",
    );
  } catch (error) {
    console.error("❌ Unable to connect to database:", error.message);
    console.log(
      "Make sure MySQL is running and database 'jobportal_nepal' exists",
    );
  }
};

module.exports = { sequelize, connectDB };
