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
 * Regional delivery fees in Ghanaian Cedis (GHS)
 * - Greater Accra: ₵25
 * - Ashanti: ₵40
 * - Western, Central, Eastern, Volta: ₵45
 * - Other regions: ₵55
 */
const REGION_FEE_MAP = {
  "Greater Accra": 25.0,
  "Ashanti": 40.0,
  "Western": 45.0,
  "Central": 45.0,
  "Eastern": 45.0,
  "Volta": 45.0,
  "Northern": 55.0,
  "Upper East": 55.0,
  "Upper West": 55.0,
  "Bono": 55.0,
  "Ahafo": 55.0,
  "Bono East": 55.0,
  "Oti": 55.0,
  "Savannah": 55.0,
  "North East": 55.0,
  "Western North": 55.0
};

/**
 * Calculate delivery fee for a given Ghanaian region
 * @param {string} region
 * @returns {number} fee in GHS
 */
function getDeliveryFee(region) {
  if (!region || typeof region !== "string") {
    return 55.0; // fallback standard fee
  }
  const cleanRegion = region.trim();
  return REGION_FEE_MAP[cleanRegion] || 55.0;
}

module.exports = {
  VALID_GHANA_REGIONS,
  REGION_FEE_MAP,
  getDeliveryFee
};
