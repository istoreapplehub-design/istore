const multer = require("multer");

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 12 // max 12 files per request
  },
  fileFilter: (req, file, cb) => {
    const allowed = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif"
    ];
    if (!allowed.includes(file.mimetype)) {
      const err = new Error("Unsupported image type");
      err.status = 400;
      return cb(err, false);
    }
    cb(null, true);
  }
});

function handleMulter(multerMiddleware) {
  return (req, res, next) => {
    multerMiddleware(req, res, (err) => {
      if (err) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({
            error: true,
            message: "File too large: maximum allowed size is 5MB"
          });
        }
        if (err.message === "Unsupported image type") {
          return res.status(400).json({
            error: true,
            message: "Unsupported image type"
          });
        }
        return res.status(400).json({
          error: true,
          message: err.message || "File upload error"
        });
      }
      next();
    });
  };
}

module.exports = {
  uploadSingle: handleMulter(upload.single("file")),
  uploadMultiple: handleMulter(upload.array("files", 12))
};
