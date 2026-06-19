const path = require("path");
const fs = require("fs-extra");
const multer = require("multer");
const config = require("../config");
const cloudinary = require("../config/cloudinary");

const ALLOWED_EXTENSIONS = /jpeg|jpg|png|gif|svg/;
const MAX_FILE_SIZE = 1_000_000; // 1 MB
const LOCAL_UPLOAD_DIR = "public/images";

/**
 * Minimal multer storage engine that streams uploads straight to Cloudinary v2.
 * We implement it ourselves (rather than depend on the unmaintained
 * `multer-storage-cloudinary`, which still peers on the v1 SDK) so we can stay
 * on the current Cloudinary SDK. It exposes the same `file.path` /
 * `file.filename` shape multer's built-in engines do.
 */
const cloudinaryStorage = {
  _handleFile(req, file, cb) {
    const stream = cloudinary.uploader.upload_stream(
      { folder: config.cloudinary.folder, resource_type: "image" },
      (error, result) => {
        if (error) return cb(error);
        cb(null, {
          path: result.secure_url,
          filename: result.public_id,
          size: result.bytes,
        });
      }
    );
    file.stream.pipe(stream);
  },
  _removeFile(req, file, cb) {
    if (!file.filename) return cb(null);
    cloudinary.uploader.destroy(file.filename, cb);
  },
};

/** Disk storage for the local driver — files land in `public/images`. */
const createDiskStorage = () => {
  fs.ensureDirSync(LOCAL_UPLOAD_DIR);
  return multer.diskStorage({
    destination: (req, file, cb) => cb(null, LOCAL_UPLOAD_DIR),
    filename: (req, file, cb) =>
      cb(null, `${Date.now()}${path.extname(file.originalname)}`),
  });
};

const fileFilter = (req, file, cb) => {
  const hasValidExt = ALLOWED_EXTENSIONS.test(
    path.extname(file.originalname).toLowerCase()
  );
  const hasValidMime = ALLOWED_EXTENSIONS.test(file.mimetype);

  if (hasValidExt && hasValidMime) return cb(null, true);
  cb(new Error("Only image files are allowed"));
};

const uploader = multer({
  storage: config.usesCloudinary ? cloudinaryStorage : createDiskStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter,
});

module.exports = {
  upload: uploader.single("image"),
  uploadMultiple: uploader.array("image", 12),
};
