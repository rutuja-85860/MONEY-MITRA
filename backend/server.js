const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// Import Routes
console.log("🔍 Loading routes...");

const authRoutes = require("./routes/auth");
const transactionRoutes = require("./routes/transactions");
const voiceRoutes = require("./routes/voice");
const onboardingRoutes = require("./routes/onboarding");
const summaryRoutes = require("./routes/summary");
const trendsRoutes = require("./routes/trends"); // ← ADD THIS
const analyticsRoutes = require("./routes/analytics");
const killSwitchRoutes = require("./routes/killSwitch");
console.log("✅ All routes loaded");

// Use Routes
app.use("/api/auth", authRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/voice", voiceRoutes);
app.use("/api/onboarding", onboardingRoutes);
app.use("/api/summary", summaryRoutes);
app.use("/api/trends", trendsRoutes); // ← ADD THIS
app.use("/api/analytics", analyticsRoutes);
app.use("/api/kill-switch", killSwitchRoutes);
// Test route
app.get("/", (req, res) => {
  res.json({ 
    message: "Backend is running", 
    routes: [
      "/api/auth",
      "/api/transactions",
      "/api/voice",
      "/api/onboarding",
      "/api/summary",
      "/api/trends",
      "/api/analytics",
      "/api/kill-s" // ← ADD THIS
    ]
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀 Server running on port ${PORT}`);
  console.log(`📡 API endpoints:`);
  console.log(`   - http://localhost:${PORT}/api/auth`);
  console.log(`   - http://localhost:${PORT}/api/transactions`);
  console.log(`   - http://localhost:${PORT}/api/voice`);
  console.log(`   - http://localhost:${PORT}/api/onboarding`);
  console.log(`   - http://localhost:${PORT}/api/summary`);
  console.log(`   - http://localhost:${PORT}/api/trends`); // ← ADD THIS
  console.log(`   - http://localhost:${PORT}/api/analytics`); 
  console.log(`   - http://localhost:${PORT}/api/kill-switch`); 
});
