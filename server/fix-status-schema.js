const { sequelize } = require("./config/database");

async function fixStatusColumn() {
  try {
    await sequelize.query(
      "ALTER TABLE applications MODIFY COLUMN status VARCHAR(50)",
    );
    console.log("✅ Fixed: applications.status now VARCHAR(50)");

    // Verify
    const [results] = await sequelize.query("DESCRIBE applications status");
    console.log("Column info:", results[0]);
  } catch (error) {
    console.error("Fix failed:", error.message);
  } finally {
    await sequelize.close();
  }
}

fixStatusColumn();
