require("dotenv").config();
const path = require("path");
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const { notFound, errorHandler } = require("./middleware/errorHandler");

const productsRouter = require("./routes/products");
const categoriesRouter = require("./routes/categories");
const userRouter = require("./routes/user");
const reviewsRouter = require("./routes/reviews");
const ordersRouter = require("./routes/orders");
const paystackRouter = require("./routes/paystack");
const installmentsRouter = require("./routes/installments");
const authRouter = require("./routes/auth");
const adminProductsRouter = require("./routes/adminProducts");
const adminUploadsRouter = require("./routes/adminUploads");
const adminOrdersRouter = require("./routes/adminOrders");
const adminSettingsRouter = require("./routes/adminSettings");
const servicesRouter = require("./routes/services");

const app = express();

// ─── 1. GLOBAL MIDDLEWARE ───────────────────────────────────────────────────
app.use(morgan("dev"));

// Empty allowlist (local dev) = any origin. In production set
// CORS_ALLOWED_ORIGINS to the comma-separated deployed web origins.
// Native RN sends no Origin header, so the mobile app is unaffected either way.
const allowedOrigins = (process.env.CORS_ALLOWED_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim().replace(/\/+$/, ""))
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (allowedOrigins.length === 0 || !origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`Origin ${origin} is not allowed by CORS`));
    }
  })
);

// ─── 2. BODY PARSERS (APPROACH B) ───────────────────────────────────────────
app.use(
  express.json({
    limit: "1mb",
    verify: (req, res, buf) => {
      // Stash raw body for Paystack webhook HMAC verification
      if (req.originalUrl === "/api/paystack/webhook") {
        req.rawBody = buf;
      }
    }
  })
);
app.use(express.urlencoded({ extended: true }));

// ─── 3. 3D / AR MODEL ASSETS (Quick Look + Scene Viewer fetch these directly) ─
app.use(
  "/models",
  (req, res, next) => {
    if (req.path.endsWith(".usdz")) res.type("model/vnd.usdz+zip");
    if (req.path.endsWith(".glb")) res.type("model/gltf-binary");
    next();
  },
  express.static(path.join(__dirname, "..", "public", "models"), { maxAge: "7d" })
);

// ─── 4. MOUNT ROUTES ────────────────────────────────────────────────────────
app.use("/api/auth", authRouter);
app.use("/api/admin/products", adminProductsRouter);
app.use("/api/admin/orders", adminOrdersRouter);
app.use("/api/admin/uploads", adminUploadsRouter);
app.use("/api/admin/settings", adminSettingsRouter);
app.use("/api/products", productsRouter);
app.use("/api/products", reviewsRouter); // Sub-routes mounted at /:slug/reviews
app.use("/api/categories", categoriesRouter);
app.use("/api/user", userRouter);
app.use("/api/orders", ordersRouter);
app.use("/api/paystack", paystackRouter);
app.use("/api/installments", installmentsRouter);
app.use("/api/services", servicesRouter);

// ─── 5. HEALTH CHECK ────────────────────────────────────────────────────────
app.get(["/", "/api/health"], (req, res) => {
  res.json({
    status: "ok",
    service: "LesTrades API",
    version: "1.0.0",
    time: new Date().toISOString()
  });
});

// ─── 6. NOT FOUND & ERROR HANDLERS (LAST) ───────────────────────────────────
app.use(notFound);
app.use(errorHandler);

module.exports = app;

// Only start the server when run directly (not during unit testing)
if (require.main === module) {
  const PORT = process.env.PORT || 5001;
  const isPaystackLive =
    process.env.PAYSTACK_SECRET_KEY &&
    !process.env.PAYSTACK_SECRET_KEY.includes("placeholder") &&
    !process.env.PAYSTACK_SECRET_KEY.includes("mock");

  app.listen(PORT, () => {
    console.log(`🚀 LesTrades API running on http://localhost:${PORT}`);
    console.log(`   Env: ${process.env.NODE_ENV || "development"}`);
    console.log(`   Paystack: ${isPaystackLive ? "LIVE" : "SIMULATION"}`);
  });
}
