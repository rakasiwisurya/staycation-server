const path = require("path");
const fs = require("fs-extra");
const config = require("../config");
const cloudinary = require("../config/cloudinary");

const isAbsoluteUrl = (value = "") => /^https?:\/\//i.test(value);

/**
 * Derives the value persisted as `imageUrl` from a freshly uploaded file.
 *
 * - cloudinary: the secure absolute URL (`file.path`)
 * - local:      a relative path served by this app (`images/<filename>`)
 */
const fileUrl = (file) =>
  config.usesCloudinary ? file.path : `images/${file.filename}`;

/**
 * Resolves a stored `imageUrl` into an absolute URL for rendering. Cloudinary
 * URLs are already absolute and pass through untouched; local paths are
 * prefixed with this server's public URL.
 */
const assetUrl = (imageUrl) => {
  if (!imageUrl) return "";
  if (isAbsoluteUrl(imageUrl)) return imageUrl;
  return `${config.serverUrl}/${imageUrl.replace(/^\//, "")}`;
};

/**
 * Extracts a Cloudinary public id (including folder) from a delivery URL, e.g.
 * `.../upload/v1699999999/staycation/abc123.jpg` -> `staycation/abc123`.
 */
const cloudinaryPublicId = (url) => {
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.[^./]+$/);
  return match ? match[1] : null;
};

/**
 * Deletes a previously stored image from whichever backend holds it. Failures
 * are swallowed (and logged) so that a missing file never blocks the operation
 * the caller is really trying to perform.
 */
const removeImage = async (imageUrl) => {
  if (!imageUrl) return;

  try {
    if (isAbsoluteUrl(imageUrl)) {
      const publicId = cloudinaryPublicId(imageUrl);
      if (publicId) await cloudinary.uploader.destroy(publicId);
    } else {
      await fs.remove(path.join("public", imageUrl));
    }
  } catch (error) {
    console.warn(`Failed to remove image "${imageUrl}": ${error.message}`);
  }
};

/**
 * Builds the stored image URL for a known demo/seed asset (by filename) for the
 * active driver: an absolute Cloudinary URL in cloudinary mode, else a relative
 * path served from public/images. Shared by the seeder and hardcoded demo
 * content (e.g. the testimonial image).
 */
const publicImageUrl = (value) => {
  const file = value.replace(/^images\//, "");
  if (config.usesCloudinary) {
    const { cloudName, folder } = config.cloudinary;
    return `https://res.cloudinary.com/${cloudName}/image/upload/${folder}/${file}`;
  }
  return `images/${file}`;
};

module.exports = { fileUrl, assetUrl, removeImage, publicImageUrl };
