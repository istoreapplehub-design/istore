const app = require("./app");

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

