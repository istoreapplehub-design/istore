const crypto = require("crypto");
const { supabaseAdmin } = require("./supabase");

const ALLOWED_MIME_TYPES = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif"
};

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const BUCKET_NAME = "product-images";

function randomString(length = 8) {
  return crypto.randomBytes(Math.ceil(length / 2)).toString("hex").slice(0, length);
}

/**
 * Uploads a single multer file to Supabase Storage
 * @param {object} file - { buffer, mimetype, originalname }
 * @param {string} folder - folder path prefix, default "products"
 * @returns {Promise<{ path: string, publicUrl: string }>}
 */
async function uploadImage(file, folder = "products") {
  if (!file || !file.buffer) {
    throw new Error("No file provided");
  }

  const ext = ALLOWED_MIME_TYPES[file.mimetype];
  if (!ext) {
    throw new Error("Unsupported image type");
  }

  if (file.buffer.length > MAX_FILE_SIZE) {
    throw new Error("Image exceeds 5MB limit");
  }

  const path = `${folder}/${Date.now()}-${randomString(8)}.${ext}`;

  const { error } = await supabaseAdmin.storage
    .from(BUCKET_NAME)
    .upload(path, file.buffer, {
      contentType: file.mimetype,
      cacheControl: "31536000", // 1 year
      upsert: false
    });

  if (error) {
    throw new Error(error.message);
  }

  const { data } = supabaseAdmin.storage
    .from(BUCKET_NAME)
    .getPublicUrl(path);

  return {
    path,
    publicUrl: data.publicUrl
  };
}

/**
 * Deletes an image from Supabase Storage by path
 * @param {string} path - storage path, e.g. "products/123-abc.jpg"
 * @returns {Promise<{ success: boolean }>}
 */
async function deleteImage(path) {
  if (!path) return { success: true };

  try {
    const { error } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .remove([path]);

    if (error && process.env.NODE_ENV === "development") {
      console.warn(`[storage] Warning deleting ${path}:`, error.message);
    }
    return { success: true };
  } catch {
    return { success: true };
  }
}

/**
 * Uploads multiple multer files to Supabase Storage
 * @param {Array<object>} files - array of multer file objects
 * @param {string} folder - folder path prefix
 * @returns {Promise<Array<{ path: string, publicUrl: string }>>}
 */
async function uploadMultiple(files, folder = "products") {
  if (!Array.isArray(files) || files.length === 0) {
    throw new Error("No files provided");
  }

  return Promise.all(files.map((file) => uploadImage(file, folder)));
}

module.exports = {
  uploadImage,
  deleteImage,
  uploadMultiple
};
