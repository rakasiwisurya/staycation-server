const { v2: cloudinary } = require("cloudinary");
const config = require("./index");

/**
 * Configures the Cloudinary SDK from environment variables. Only relevant when
 * `STORAGE_DRIVER=cloudinary` (the production branch); harmless otherwise.
 */
if (config.usesCloudinary) {
  cloudinary.config({
    cloud_name: config.cloudinary.cloudName,
    api_key: config.cloudinary.apiKey,
    api_secret: config.cloudinary.apiSecret,
    secure: true,
  });
}

module.exports = cloudinary;
