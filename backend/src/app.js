require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const { notFound, errorHandler } = require("./middleware/errorHandler");

const productsRouter = require("./routes/products");
const categoriesRouter = require("./routes/categories");
const reviewsRouter = require("./routes/reviews");
const ordersRouter = require("./routes/orders");
const paystackRouter = require("./routes/paystack");
const authRouter = require("./routes/auth");
const adminProductsRouter = require("./routes/adminProducts");

const app = express();

// ─── 1. GLOBAL MIDDLEWARE ───────────────────────────────────────────────────
app.use(morgan("dev"));

// TODO: Restrict origin to your app domain before production
app.use(cors());

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

// ─── 3. MOUNT ROUTES ────────────────────────────────────────────────────────
app.use("/api/auth", authRouter);
app.use("/api/admin/products", adminProductsRouter);
app.use("/api/products", productsRouter);
app.use("/api/products", reviewsRouter); // Sub-routes mounted at /:slug/reviews
app.use("/api/categories", categoriesRouter);
app.use("/api/orders", ordersRouter);
app.use("/api/paystack", paystackRouter);

// ─── 4. HEALTH CHECK ────────────────────────────────────────────────────────
app.get(["/", "/api/health"], (req, res) => {
  res.json({
    status: "ok",
    service: "I-Store API",
    version: "1.0.0",
    time: new Date().toISOString()
  });
});

// ─── 5. NOT FOUND & ERROR HANDLERS (LAST) ───────────────────────────────────
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
    console.log(`🚀 I-Store API running on http://localhost:${PORT}`);
    console.log(`   Env: ${process.env.NODE_ENV || "development"}`);
    console.log(`   Paystack: ${isPaystackLive ? "LIVE" : "SIMULATION"}`);
  });
}
