const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
require("dotenv").config();

const { sequelize } = require("./models");

// Import routes
const authRoutes = require("./routes/auth");
const archerRoutes = require("./routes/archers");
const roundRoutes = require("./routes/rounds");
const scoreRoutes = require("./routes/scores");
const competitionRoutes = require("./routes/competitions");
const championshipRoutes = require("./routes/championships");
const metadataRoutes = require("./routes/metadata");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS
app.use(morgan("dev")); // HTTP request logger
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "Archery API is running" });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/archers", archerRoutes);
app.use("/api/rounds", roundRoutes);
app.use("/api/scores", scoreRoutes);
app.use("/api/competitions", competitionRoutes);
app.use("/api/championships", championshipRoutes);
app.use("/api", metadataRoutes); // classes, divisions, categories

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(err.status || 500).json({
    error: err.message || "Internal server error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

// Database connection and server start
async function startServer() {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log("✅ Database connection established successfully");

    // Sync models (use { alter: true } in development, avoid in production)
    // await sequelize.sync({ alter: true });
    // console.log('✅ Database models synchronized');

    // Start server
    const server = app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`📍 API URL: http://localhost:${PORT}/api`);
      console.log(`🏥 Health check: http://localhost:${PORT}/health`);
      console.log(`\n🔐 Default Admin Credentials:`);
      console.log(`   Email: admin@archery.club`);
      console.log(`   Password: admin123`);
      console.log(
        `\n⚠️  Remember to run 'npm run seed' if this is a fresh database!`
      );
    });
    return server;
  } catch (error) {
    console.error("❌ Unable to start server:", error);
    process.exit(1);
  }
}

module.exports = app;

// Only start the server if this file is run directly (not imported as a module)
if (require.main === module) {
  // Database connection and server start
  startServer();
}
