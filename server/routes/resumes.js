const express = require("express");
const router = express.Router();
const resumeController = require("../controllers/resumeController");
const auth = require("../middleware/auth");

router.get("/", auth.verifyToken, resumeController.getResumes);

router.get("/:id", auth.verifyToken, resumeController.getResume);

router.post("/", auth.verifyToken, resumeController.createResume);

router.put("/:id", auth.verifyToken, resumeController.updateResume);

router.delete("/:id", auth.verifyToken, resumeController.deleteResume);

router.patch(
  "/:id/default",
  auth.verifyToken,
  resumeController.setDefaultResume,
);

module.exports = router;
