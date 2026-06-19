require("dotenv").config();

/**
 * Single source of truth for runtime configuration.
 *
 * Everything that differs between the `main` (local) and `production` branches
 * is driven by environment variables so the codebase stays identical on both.
 */

const parseOrigins = (value) =>
  (value || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

const config = {
  env: process.env.NODE_ENV || "development",
  port: parseInt(process.env.PORT, 10) || 4000,

  // Absolute, public-facing base URL of this server (no trailing slash).
  // Used to build asset URLs for locally stored images.
  serverUrl: (process.env.SERVER_URL || "http://localhost:4000").replace(/\/$/, ""),

  mongoUri: process.env.MONGODB_URI || "mongodb://localhost:27017/db_staycation",

  // Where uploaded images live: "local" (disk) or "cloudinary".
  storageDriver: (process.env.STORAGE_DRIVER || "local").toLowerCase(),

  session: {
    secret: process.env.SESSION_SECRET || "staycation-dev-secret",
  },

  // Allowed browser origins for the API (the React client).
  // Empty list = reflect any origin (handy for local development).
  corsOrigins: parseOrigins(process.env.CLIENT_URL),

  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
    folder: process.env.CLOUDINARY_FOLDER || "staycation",
  },
};

config.isProduction = config.env === "production";
config.usesCloudinary = config.storageDriver === "cloudinary";

module.exports = config;
