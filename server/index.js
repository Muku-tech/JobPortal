const express = require("express");
const cors = require("cors");
require("dotenv").config();

const { connectDB } = require("./config/database");
const routes = require("./routes");
const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
const messagesRoutes = require("./routes/messages");
app.use("/api", routes);
app.use("/api/messages", messagesRoutes);

// Serve static logos
const path = require("path");
app.use("/logos", express.static(path.join(__dirname, "public/logos")));

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
