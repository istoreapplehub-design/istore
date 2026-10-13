const { uploadImage, uploadMultiple, deleteImage: storageDeleteImage } = require("../utils/storage");

/**
 * 1. POST /api/admin/uploads/image
 * Uploads a single image to Supabase Storage
 */
async function uploadSingleImage(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: true,
        message: "No file provided"
      });
    }

    const image = await uploadImage(req.file, "products");

    if (process.env.NODE_ENV === "development") {
      console.log(`[admin] ${req.user?.email || "Admin"} uploaded image: ${image.path}`);
    }

    return res.status(200).json({
      success: true,
      image
    });
  } catch (err) {
    next(err);
  }
}

/**
 * 2. POST /api/admin/uploads/images
 * Uploads multiple images (up to 12) to Supabase Storage
 */
async function uploadMultipleImages(req, res, next) {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        error: true,
        message: "No files provided"
      });
    }

    if (req.files.length > 12) {
      return res.status(400).json({
        error: true,
        message: "Maximum 12 files per upload"
      });
    }

    const images = await uploadMultiple(req.files, "products");

    if (process.env.NODE_ENV === "development") {
      console.log(`[admin] ${req.user?.email || "Admin"} uploaded ${images.length} images`);
    }

    return res.status(200).json({
      success: true,
      count: images.length,
      images
    });
  } catch (err) {
    next(err);
  }
}

/**
 * 3. DELETE /api/admin/uploads
 * Deletes an image by path from Supabase Storage
 */
async function deleteImage(req, res, next) {
  try {
    const { path } = req.body;

    await storageDeleteImage(path);

    if (process.env.NODE_ENV === "development") {
      console.log(`[admin] ${req.user?.email || "Admin"} deleted image: ${path}`);
    }

    return res.status(200).json({
      success: true,
      message: "Image deleted"
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  uploadSingleImage,
  uploadMultipleImages,
  deleteImage
};
