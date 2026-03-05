const winston = require("winston");
const path = require("path");

const { combine, timestamp, printf, colorize, errors } = winston.format;

const logFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level}]: ${stack || message}`;
});

const isProduction = process.env.NODE_ENV === "production" || process.env.RENDER;

const logger = winston.createLogger({
  level: isProduction ? "info" : "debug",
  format: combine(
    timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    errors({ stack: true }),
    logFormat
  ),
  transports: [
    new winston.transports.Console({
      format: combine(
        colorize(),
        timestamp({ format: "HH:mm:ss" }),
        errors({ stack: true }),
        logFormat
      ),
    }),
  ],
});

// Add file logging only if not in production/Render
if (!isProduction) {
  logger.add(
    new winston.transports.File({
      filename: path.join("logs", "error.log"),
      level: "error",
    })
  );
  logger.add(
    new winston.transports.File({
      filename: path.join("logs", "combined.log"),
    })
  );
}

module.exports = logger;
