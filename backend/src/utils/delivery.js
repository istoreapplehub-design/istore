/**
 * Official 16 Administrative Regions of Ghana
 */
const VALID_GHANA_REGIONS = [
  "Greater Accra",
  "Ashanti",
  "Western",
  "Central",
  "Eastern",
  "Volta",
  "Northern",
  "Upper East",
  "Upper West",
  "Bono",
  "Ahafo",
  "Bono East",
  "Oti",
  "Savannah",
  "North East",
  "Western North"
];

/**
 * Regions supported by Uber On-Demand Dispatch in Ghana
 */
const UBER_SUPPORTED_REGIONS = ["Greater Accra", "Ashanti"];

/**
 * Base delivery fees for Uber-supported regions in Ghanaian Cedis (GHS)
 */
const UBER_REGION_FEE_MAP = {
  "Greater Accra": 25.0,
  Ashanti: 40.0
};

/**
 * Comprehensive delivery quote calculation
 * - Uber regions: Fee charged online via Paystack
 * - Non-Uber regions: ₵0.00 charged online, fee paid upon arrival (TBD)
 */
function getDeliveryQuote(region) {
  if (!region || typeof region !== "string") {
    return {
      feeGHS: 0,
      isUber: false,
      isTbd: true,
      provider: "pay_on_delivery",
      label: "TBD — Pay on Delivery",
      description: "Pay driver or station upon package arrival"
    };
  }

  const cleanRegion = region.trim();
  const isUber = UBER_SUPPORTED_REGIONS.includes(cleanRegion);

  if (isUber) {
    const fee = UBER_REGION_FEE_MAP[cleanRegion] || 25.0;
    return {
      feeGHS: fee,
      isUber: true,
      isTbd: false,
      provider: "uber",
      label: `₵${fee.toFixed(2)} (Uber Express)`,
      description: "Direct doorstep courier delivery via Uber"
    };
  }

  return {
    feeGHS: 0,
    isUber: false,
    isTbd: true,
    provider: "pay_on_delivery",
    label: "TBD — Pay to Driver/Station upon Delivery",
    description: "Delivery fee paid directly to the courier or bus terminal upon collection"
  };
}

/**
 * Calculate delivery fee to charge online for a given Ghanaian region
 * @param {string} region
 * @returns {number} fee in GHS (0 for non-Uber regions)
 */
function getDeliveryFee(region) {
  return getDeliveryQuote(region).feeGHS;
}

module.exports = {
  VALID_GHANA_REGIONS,
  UBER_SUPPORTED_REGIONS,
  UBER_REGION_FEE_MAP,
  getDeliveryQuote,
  getDeliveryFee
};

