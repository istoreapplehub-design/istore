const express = require("express");
const router = express.Router();

const GHANA_HUBS = [
  {
    id: "ucc-cape-coast",
    name: "LesTrades Flagship Hub — UCC Cape Coast",
    city: "Cape Coast",
    region: "Central Region",
    address: "University of Cape Coast, Campus Commercial Hub, Cape Coast",
    landmark: "Directly opposite UCC Central Library / Main Gate",
    gpsCode: "CC-041-9201",
    phone: "024 282 6590",
    hours: "Mon–Sat: 8:30 AM – 8:00 PM · Sun: 12:00 PM – 6:00 PM",
    services: ["Genius Bar Repairs", "Today at Apple Workshops", "Store Pickup", "Trade In"]
  },
  {
    id: "accra-mall",
    name: "LesTrades Genius Bar — Accra Mall",
    city: "Accra",
    region: "Greater Accra",
    address: "Tetteh Quarshie Interchange, Shop G12, Accra",
    landmark: "Ground floor near Food Court",
    gpsCode: "GA-183-4921",
    phone: "024 282 6590",
    hours: "Mon–Sat: 9:00 AM – 9:00 PM · Sun: 11:00 AM – 7:00 PM",
    services: ["Genius Bar Repairs", "Today at Apple Workshops", "Store Pickup", "Trade In"]
  },
  {
    id: "east-legon",
    name: "LesTrades Tech Flagship — East Legon",
    city: "Accra",
    region: "Greater Accra",
    address: "Boundary Road, Opp. A&C Mall, East Legon",
    landmark: "Opposite A&C Corner",
    gpsCode: "GA-492-1082",
    phone: "024 282 6590",
    hours: "Mon–Sat: 8:30 AM – 8:00 PM · Sun: 12:00 PM – 6:00 PM",
    services: ["Genius Bar Repairs", "Pro Engineering Labs", "Store Pickup", "Trade In"]
  },
  {
    id: "kumasi-mall",
    name: "LesTrades Genius Lounge — Kumasi City Mall",
    city: "Kumasi",
    region: "Ashanti",
    address: "Asokwa, Kumasi City Mall, Shop 24, Kumasi",
    landmark: "Entrance 2, Level 1",
    gpsCode: "AK-039-8120",
    phone: "024 282 6590",
    hours: "Mon–Sat: 9:00 AM – 8:00 PM · Sun: 12:00 PM – 6:00 PM",
    services: ["Genius Bar Repairs", "Today at Apple Workshops", "Store Pickup", "Trade In"]
  }
];

// In-memory appointments and RSVPs for live sessions
const geniusBookings = [];
const workshopRegistrations = [];

/**
 * GET /api/services/hubs
 * List certified Apple Store Hubs in Ghana
 */
router.get("/hubs", (req, res) => {
  res.json({ success: true, hubs: GHANA_HUBS });
});

/**
 * POST /api/services/genius-bar
 * Book an in-person Genius Bar diagnostic or hardware repair appointment
 */
router.post("/genius-bar", (req, res) => {
  const { customerName, phone, device, issue, hubId, date, slot, serialNumber, notes } = req.body;

  if (!customerName || !phone) {
    return res.status(400).json({ error: "Customer name and phone number are required." });
  }

  const hub = GHANA_HUBS.find((h) => h.id === hubId) || GHANA_HUBS[0];
  const reference = `GB-GH-${Math.floor(1000 + Math.random() * 9000)}`;

  const booking = {
    reference,
    customerName,
    phone,
    device: device || "Apple Hardware",
    issue: issue || "Diagnostic Check",
    hub,
    date: date || "Today",
    slot: slot || "12:00 PM",
    serialNumber: serialNumber || null,
    notes: notes || null,
    status: "confirmed",
    createdAt: new Date().toISOString()
  };

  geniusBookings.push(booking);

  res.status(201).json({
    success: true,
    message: "Genius Bar appointment reserved successfully.",
    booking
  });
});

/**
 * POST /api/services/today-at-apple
 * Register for a free creative or coding workshop in Ghana
 */
router.post("/today-at-apple", (req, res) => {
  const { attendeeName, attendeePhone, attendeeEmail, sessionId, sessionTitle, hub } = req.body;

  if (!attendeeName || !attendeePhone) {
    return res.status(400).json({ error: "Attendee name and phone number are required." });
  }

  const passId = `TAA-GH-${Math.floor(1000 + Math.random() * 9000)}`;

  const reg = {
    passId,
    attendeeName,
    attendeePhone,
    attendeeEmail: attendeeEmail || null,
    sessionId: sessionId || "workshop",
    sessionTitle: sessionTitle || "Creative Session",
    hub: hub || "Accra Mall Forum",
    status: "confirmed",
    createdAt: new Date().toISOString()
  };

  workshopRegistrations.push(reg);

  res.status(201).json({
    success: true,
    message: "Today at Apple workshop spot reserved.",
    registration: reg
  });
});

/**
 * POST /api/services/trade-in/quote
 * Generate or verify serial-based trade-in valuation in Ghanaian Cedis
 */
router.post("/trade-in/quote", (req, res) => {
  const { serialOrImei, screenCondition, batteryHealth, sensorsWorking, icloudUnlocked } = req.body;

  if (!serialOrImei || serialOrImei.trim().length < 8) {
    return res.status(400).json({ error: "A valid Apple serial number or 15-digit IMEI is required." });
  }

  if (icloudUnlocked === false) {
    return res.status(400).json({
      error: "Device must be free of Apple ID / iCloud Activation Lock before trade-in."
    });
  }

  // Calculate base valuation in GHS
  const cleaned = serialOrImei.trim().toUpperCase();
  let baseValue = 13500;
  let modelName = "iPhone 15 Pro";

  if (cleaned.startsWith("G6") || cleaned.includes("16")) {
    baseValue = 18500;
    modelName = "iPhone 16 Pro Max";
  } else if (cleaned.startsWith("C02")) {
    baseValue = 22000;
    modelName = "MacBook Pro 16″ (M3)";
  } else if (cleaned.startsWith("DMP")) {
    baseValue = 14500;
    modelName = "iPad Pro 13″ (M4)";
  } else if (cleaned.startsWith("H1")) {
    baseValue = 7500;
    modelName = "Apple Watch Ultra 2";
  }

  let finalValue = baseValue;
  if (screenCondition === "light") finalValue -= 800;
  if (screenCondition === "cracked") finalValue -= 3200;
  if (batteryHealth === "fair") finalValue -= 900;
  if (batteryHealth === "service") finalValue -= 1800;
  if (sensorsWorking === false) finalValue -= 1500;

  finalValue = Math.max(500, Math.round(finalValue));
  const quoteCode = `TI-GH-${Math.floor(10000 + Math.random() * 90000)}`;

  res.json({
    success: true,
    quoteCode,
    modelName,
    serialOrImei: cleaned,
    creditGHS: finalValue,
    currency: "GHS",
    validDays: 14,
    redeemHubs: ["Accra Mall Studio", "East Legon Flagship", "Kumasi City Mall", "VIP Courier Pickup"]
  });
});

module.exports = router;
