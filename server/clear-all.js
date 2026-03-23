require("dotenv").config();
const { sequelize } = require("./config/database");
const { User, Job, Application, JobView } = require("./models");

async function clearAllData() {
  try {
    await sequelize.transaction(async (t) => {
      await JobView.destroy({ where: {}, transaction: t });
      await Application.destroy({ where: {}, transaction: t });
      await Job.destroy({ where: {}, transaction: t });
      await User.destroy({ where: {}, transaction: t });
    });
    console.log("✅ All users, jobs, applications, and job views cleared.");
  } catch (error) {
    console.error("❌ Error clearing data:", error.message);
  } finally {
    process.exit(0);
  }
}

clearAllData();
