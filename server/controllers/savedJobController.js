const { SavedJob, Job, User } = require("../models");

// POST /jobs/:id/save  — toggle save (save if not saved, unsave if already saved)
exports.toggleSave = async (req, res) => {
  try {
    const userId = req.user.id;
    const jobId = parseInt(req.params.id);

    const existing = await SavedJob.findOne({ where: { user_id: userId, job_id: jobId } });
    if (existing) {
      await existing.destroy();
      return res.json({ saved: false, message: "Job removed from saved" });
    }

    await SavedJob.create({ user_id: userId, job_id: jobId });
    res.json({ saved: true, message: "Job saved successfully" });
  } catch (err) {
    console.error("toggleSave error:", err);
    res.status(500).json({ message: "Error saving job" });
  }
};

// GET /jobs/saved — list all saved jobs for the logged-in user
exports.getSavedJobs = async (req, res) => {
  try {
    const userId = req.user.id;

    const saved = await SavedJob.findAll({
      where: { user_id: userId },
      include: [
        {
          model: Job,
          as: "job",
          include: [
            {
              model: User,
              as: "employer",
              attributes: ["id", "name", "email"],
            },
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    // Filter out any orphaned entries where job was deleted
    const jobs = saved
      .filter((s) => s.job !== null)
      .map((s) => ({ ...s.job.toJSON(), savedAt: s.createdAt }));

    res.json({ jobs, total: jobs.length });
  } catch (err) {
    console.error("getSavedJobs error:", err);
    res.status(500).json({ message: "Error fetching saved jobs" });
  }
};

// GET /jobs/:id/saved-status — check if a specific job is saved
exports.getSavedStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const jobId = parseInt(req.params.id);
    const existing = await SavedJob.findOne({ where: { user_id: userId, job_id: jobId } });
    res.json({ saved: !!existing });
  } catch (err) {
    res.status(500).json({ message: "Error checking saved status" });
  }
};
