const express = require("express");
const router = express.Router();
const applicationController = require("../controllers/applicationController");
const auth = require("../middleware/auth");
const messageController = require("../controllers/messageController");
const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/resumes/");
  },
  filename: (req, file, cb) => {
    cb(null, `resume-${Date.now()}${path.extname(file.originalname)}`);
  },
});
const upload = multer({ storage });

router.post(
  "/",
  auth.verifyToken,
  upload.single("resumePdf"),
  applicationController.applyForJob,
);

router.get("/user", auth.verifyToken, applicationController.getMyApplications);

router.get(
  "/employer-all",
  auth.verifyToken,
  applicationController.getEmployerApplications,
);

router.get(
  "/job/:jobId",
  auth.verifyToken,
  applicationController.getJobApplications,
);

router.post(
  "/:id/action",
  auth.verifyToken,
  require("../controllers/applicationActionController").performAction,
);

router.get(
  "/:id/messages",
  auth.verifyToken,
  require("../controllers/applicationActionController").getApplicationMessages,
);

router.get(
  "/:id/messages-count",
  auth.verifyToken,
  messageController.getUnreadPerApp,
);

router.put(
  "/:id/messages/read-all",
  auth.verifyToken,
  messageController.markAppAllRead,
);

router.post(
  "/:id/messages",
  auth.verifyToken,
  applicationController.sendApplicationMessage,
);

module.exports = router;
