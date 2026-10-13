const express = require("express");
const router = express.Router();
const {
  uploadSingleImage,
  uploadMultipleImages,
  deleteImage
} = require("../controllers/adminUploadController");
const { requireAuth, requireAdmin } = require("../middleware/auth");
const {
  uploadSingle,
  uploadMultiple
} = require("../middleware/upload");
const { validate } = require("../middleware/validate");
const { z } = require("zod");

const deleteImageSchema = z.object({
  path: z.string().min(1, "Image path is required")
});

router.use(requireAuth, requireAdmin);

router.post("/image", uploadSingle, uploadSingleImage);
router.post("/images", uploadMultiple, uploadMultipleImages);
router.delete(
  "/",
  validate({ body: deleteImageSchema }),
  deleteImage
);

module.exports = router;
