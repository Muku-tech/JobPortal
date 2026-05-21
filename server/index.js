const express = require("express");
const cors = require("cors");
require("dotenv").config();
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const { connectDB } = require("./config/database");
const routes = require("./routes");
const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Ensure the directory exists
    const uploadPath = path.join(__dirname, "public/resumes");
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage: storage });
app.use(upload.single("resumePdf")); // Middleware to handle single file upload with field name 'resumePdf'

// Routes
const messagesRoutes = require("./routes/messages");
app.use("/api", routes);
app.use("/api/messages", messagesRoutes);

// Serve static files (logos and resumes)
app.use("/logos", express.static(path.join(__dirname, "public/logos")));
app.use("/resumes", express.static(path.join(__dirname, "public/resumes")));

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "JobPortal API is running" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong!" });
});

// Start server with port retry logic
const startServer = async (port) => {
  const server = app.listen(port, () => {
    console.log(`Server running on port ${port}`);
    console.log(`API available at http://localhost:${port}/api`);
  });

  server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      const nextPort = parseInt(port) + 1;
      if (nextPort > 6000) {
        console.error("No available port found");
        process.exit(1);
        return;
      }
      console.log(`Port ${port} is in use, trying ${nextPort}...`);
      startServer(nextPort);
    } else {
      console.error("Failed to start server:", err);
      process.exit(1);
    }
  });
};

// Start server
const start = async () => {
  try {
    await connectDB();
    startServer(PORT);
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

start();
