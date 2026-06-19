/**
 * Copies every asset from one Cloudinary folder to another (non-destructive —
 * the source assets are left in place). Used to restructure the media library,
 * e.g. `staycation_images` -> `staycation`.
 *
 * Usage:
 *   node scripts/cloudinary-copy-folder.js                 # staycation_images -> CLOUDINARY_FOLDER
 *   SOURCE_FOLDER=old DEST_FOLDER=new node scripts/cloudinary-copy-folder.js
 *   DRY_RUN=1 node scripts/cloudinary-copy-folder.js       # list only, copy nothing
 *
 * Requires the Cloudinary credentials in your environment / .env.
 */
const { v2: cloudinary } = require("cloudinary");
const config = require("../config");

cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
  secure: true,
});

const SOURCE_FOLDER = process.env.SOURCE_FOLDER || "staycation_images";
const DEST_FOLDER = process.env.DEST_FOLDER || config.cloudinary.folder || "staycation";
const DRY_RUN = !!process.env.DRY_RUN;

/** Pages through every upload resource under `<folder>/`. */
const listFolder = async (folder) => {
  const resources = [];
  let nextCursor;
  do {
    const page = await cloudinary.api.resources({
      type: "upload",
      prefix: `${folder}/`,
      max_results: 500,
      next_cursor: nextCursor,
    });
    resources.push(...page.resources);
    nextCursor = page.next_cursor;
  } while (nextCursor);
  return resources;
};

const run = async () => {
  if (SOURCE_FOLDER === DEST_FOLDER) {
    throw new Error("SOURCE_FOLDER and DEST_FOLDER must differ");
  }

  const assets = await listFolder(SOURCE_FOLDER);
  console.log(
    `Found ${assets.length} asset(s) in "${SOURCE_FOLDER}/" -> copying to "${DEST_FOLDER}/"` +
      (DRY_RUN ? " (DRY RUN)" : "")
  );

  let copied = 0;
  for (const asset of assets) {
    const name = asset.public_id.slice(SOURCE_FOLDER.length + 1); // strip "SOURCE/"
    const destPublicId = `${DEST_FOLDER}/${name}`;

    if (DRY_RUN) {
      console.log(`  would copy ${asset.public_id} -> ${destPublicId}`);
      continue;
    }

    await cloudinary.uploader.upload(asset.secure_url, {
      public_id: destPublicId,
      resource_type: asset.resource_type,
      overwrite: true,
    });
    copied += 1;
    console.log(`  copied ${asset.public_id} -> ${destPublicId}`);
  }

  console.log(DRY_RUN ? "Dry run complete." : `Done. Copied ${copied} asset(s).`);
};

run().catch((error) => {
  console.error("Copy failed:", error.message || error);
  process.exit(1);
});
