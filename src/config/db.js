const mongoose = require("mongoose");
const logger = require("../utils/logger");

const connectDB = async () => {
  try {
    logger.info("⏳ Connecting to MongoDB...");
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    logger.info(`✅ MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    logger.error("❌ MongoDB connection error:", err.message);
    throw err;
  }
};

const disconnectDB = async () => {
  await mongoose.disconnect();
  logger.info("MongoDB disconnected");
};

module.exports = { connectDB, disconnectDB };
