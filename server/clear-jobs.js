require("dotenv").config();
const { sequelize } = require("./config/database");
const { Job, Application, JobView } = require("./models");

async function clearSeededJobs() {
  try {
    await sequelize.transaction(async (t) => {
      await JobView.destroy({ where: {}, transaction: t });
      await Application.destroy({ where: {}, transaction: t });
      await Job.destroy({ where: {}, transaction: t });
    });
    console.log("✅ All jobs, applications, and job views cleared.");
  } catch (error) {
    console.error("❌ Error clearing jobs:", error.message);
  } finally {
    process.exit(0);
  }
}

clearSeededJobs();
