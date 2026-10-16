require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const { safeJsonStringify } = require("../src/utils/json");
const { supabaseAdmin } = require("../src/utils/supabase");

const prisma = new PrismaClient();

const GHANAIAN_REVIEWERS = [
  "Kwame Mensah",
  "Ama Serwaa",
  "Kofi Boateng",
  "Akosua Adjei",
  "Yaw Darko",
  "Abena Owusu",
  "Kojo Asante",
  "Efua Mensimah",
  "Kwabena Nkrumah",
  "Adwoa Frimpong",
  "Nana Yaa",
  "Kwesi Appiah"
];

const REVIEW_TEMPLATES = [
  {
    title: "Sealed box, lightning fast delivery in Accra",
    body: "Ordered on Monday afternoon, delivered Wednesday morning right to East Legon. Sealed Apple box, genuine 1-year warranty verified online. Highly recommend I-Store!",
    rating: 5
  },
  {
    title: "Battery life is absolutely insane",
    body: "Upgraded from my older device and the battery easily lasts me two full days of heavy work and traffic navigation. Worth every single cedi.",
    rating: 5
  },
  {
    title: "Top-tier quality and swift delivery to Kumasi",
    body: "Price is on the higher side but the build quality and performance is unmatched. Was delivered to Kumasi in perfect protective packaging.",
    rating: 5
  },
  {
    title: "Smooth checkout with MTN MoMo",
    body: "Paid seamlessly via MTN Mobile Money. Immediate SMS receipt and order confirmation. The screen and performance are unbelievable.",
    rating: 5
  },
  {
    title: "Genuine Apple product, zero regrets",
    body: "Took it straight to an authorized tech center to verify authenticity. 100% genuine Apple hardware. Display is gorgeous.",
    rating: 4
  },
  {
    title: "Premium experience from unboxing to daily use",
    body: "Everything feels solid and polished. Cameras and processing speed handle all my creative workloads without breaking a sweat.",
    rating: 5
  }
];

const PHOTO_BASE = "https://nxycejiuwpbocaiqwsdt.supabase.co/storage/v1/object/public/product-images/products";

/** Every listing ships with one real studio render, uploaded via scripts/attach-product-photos.js */
const photo = (slug) => [`${PHOTO_BASE}/${slug}.jpg`];

const PRODUCTS_DATA = [
  // ─── 1. IPHONES ──────────────────────────────────────────────────────────
  {
    name: "iPhone 15 Pro Max 256GB",
    slug: "iphone-15-pro-max-256gb",
    category: "iPhone",
    model: "A3106",
    storage: "256GB",
    priceGHS: 18500,
    compareAtPriceGHS: 19900,
    stock: 18,
    description:
      "iPhone 15 Pro Max is forged in aerospace-grade titanium and powered by the groundbreaking A17 Pro chip. Designed to redefine what a smartphone can achieve, it combines extraordinary structural lightness with the most durable glass front in the industry.\n\nThe revolutionary 5x Telephoto camera delivers the longest optical zoom ever in an iPhone, enabling breathtaking close-ups from unprecedented distances. Whether shooting 4K ProRes video or navigating Accra's vibrant streets, the Super Retina XDR display with ProMotion brings unrivaled responsiveness to your hands.",
    specs: {
      display: "6.7-inch Super Retina XDR OLED (2796 x 1290) at 460 ppi, 120Hz ProMotion, Always-On",
      chip: "A17 Pro chip with 6-core GPU and hardware-accelerated ray tracing",
      camera: "Pro camera system: 48MP Main, 12MP Ultra Wide, 12MP 5x Telephoto with tetraprism design",
      battery: "Up to 29 hours video playback, fast charge up to 50% in 30 minutes with 20W adapter",
      weight: "221 grams",
      connectivity: "USB-C with USB 3 speeds (up to 10Gb/s), 5G, Wi-Fi 6E, Bluetooth 5.3",
      waterResistance: "Rated IP68 (maximum depth of 6 meters up to 30 minutes)"
    },
    warranty: "1 Year Apple Warranty",
    condition: "New",
    rating: 4.9,
    reviewCount: 142,
    featured: true,
    tags: "new,featured,bestseller,deal",
    displayOrder: 1,
    colors: [
      {
        name: "Natural Titanium",
        hex: "#9E978E",
        images: photo("iphone-15-pro-max-256gb")
      },
      {
        name: "Blue Titanium",
        hex: "#39434F",
        images: photo("iphone-15-pro-max-256gb")
      },
      {
        name: "White Titanium",
        hex: "#F2F2ED",
        images: photo("iphone-15-pro-max-256gb")
      },
      {
        name: "Black Titanium",
        hex: "#28292A",
        images: photo("iphone-15-pro-max-256gb")
      }
    ],
    images: photo("iphone-15-pro-max-256gb")
  },
  {
    name: "iPhone 15 Pro 128GB",
    slug: "iphone-15-pro-128gb",
    category: "iPhone",
    model: "A3102",
    storage: "128GB",
    priceGHS: 15900,
    compareAtPriceGHS: null,
    stock: 22,
    description:
      "iPhone 15 Pro packs pro-tier titanium power into an ultra-comfortable 6.1-inch form factor. With aerospace-grade durability and contoured borders, it feels lighter and more intuitive than ever before.\n\nFeaturing the customizable Action button, switch seamlessly between silent mode, camera focus, voice memo, or your favorite shortcut. Next-generation portraits and cinematic video capture empower creators across Ghana to capture high-definition memories with studio precision.",
    specs: {
      display: "6.1-inch Super Retina XDR OLED (2556 x 1179) at 460 ppi, ProMotion 120Hz",
      chip: "A17 Pro chip with 6-core CPU and 6-core GPU",
      camera: "48MP Main, 12MP Ultra Wide, 12MP 3x Telephoto",
      battery: "Up to 23 hours video playback",
      weight: "187 grams",
      connectivity: "USB-C, 5G, Wi-Fi 6E, Bluetooth 5.3",
      waterResistance: "IP68 water resistant"
    },
    warranty: "1 Year Apple Warranty",
    condition: "New",
    rating: 4.8,
    reviewCount: 96,
    featured: false,
    tags: "new,bestseller",
    displayOrder: 2,
    colors: [
      { name: "Natural Titanium", hex: "#9E978E", images: photo("iphone-15-pro-128gb") },
      { name: "Black Titanium", hex: "#28292A", images: photo("iphone-15-pro-128gb") }
    ],
    images: photo("iphone-15-pro-128gb")
  },
  {
    name: "iPhone 15 128GB",
    slug: "iphone-15-128gb",
    category: "iPhone",
    model: "A3090",
    storage: "128GB",
    priceGHS: 12900,
    compareAtPriceGHS: null,
    stock: 35,
    description:
      "iPhone 15 introduces the Dynamic Island to the core lineup, seamlessly surfacing alerts and Live Activities so you never miss a beat. With color-infused glass back and a durable aluminum frame, it looks as vibrant as it performs.\n\nThe all-new 48MP Main camera shoots in super-high resolution, capturing rich detail, vibrant colors, and 2x optical-quality Telephoto portraits. Complete with USB-C universal charging, iPhone 15 delivers everyday perfection.",
    specs: {
      display: "6.1-inch Super Retina XDR OLED (2556 x 1179) with Dynamic Island",
      chip: "A16 Bionic chip with 5-core GPU",
      camera: "Dual camera: 48MP Main with 2x Telephoto + 12MP Ultra Wide",
      battery: "Up to 20 hours video playback",
      weight: "171 grams",
      connectivity: "USB-C, 5G, Wi-Fi 6, Bluetooth 5.3",
      waterResistance: "IP68"
    },
    warranty: "1 Year Apple Warranty",
    condition: "New",
    rating: 4.85,
    reviewCount: 110,
    featured: false,
    tags: "new,bestseller,popular",
    displayOrder: 3,
    colors: [
      { name: "Black", hex: "#353839", images: photo("iphone-15-128gb") },
      { name: "Blue", hex: "#D4E1E8", images: photo("iphone-15-128gb") },
      { name: "Pink", hex: "#FCE1E4", images: photo("iphone-15-128gb") }
    ],
    images: photo("iphone-15-128gb")
  },
  {
    name: "iPhone 14 128GB",
    slug: "iphone-14-128gb",
    category: "iPhone",
    model: "A2882",
    storage: "128GB",
    priceGHS: 10500,
    compareAtPriceGHS: null,
    stock: 20,
    description:
      "iPhone 14 delivers proven reliability, full-day battery life, and life-saving safety features including Crash Detection and Emergency SOS. Built with aerospace-grade aluminum and Ceramic Shield front, it withstands daily life effortlessly.\n\nTake stunning photos in low light with the advanced dual-camera system powered by the Photonic Engine. With smooth iOS 18 support, iPhone 14 remains an unbeatable value for Ghanaian Apple enthusiasts.",
    specs: {
      display: "6.1-inch Super Retina XDR OLED (2532 x 1170)",
      chip: "A15 Bionic chip with 5-core GPU",
      camera: "Dual 12MP Main and Ultra Wide cameras with Photonic Engine",
      battery: "Up to 20 hours video playback",
      weight: "172 grams",
      connectivity: "Lightning, 5G, Wi-Fi 6",
      waterResistance: "IP68"
    },
    warranty: "1 Year Apple Warranty",
    condition: "New",
    rating: 4.7,
    reviewCount: 78,
    featured: false,
    tags: "bestseller",
    displayOrder: 4,
    colors: [
      { name: "Midnight", hex: "#1C232B", images: photo("iphone-14-128gb") },
      { name: "Starlight", hex: "#F9F6EF", images: photo("iphone-14-128gb") }
    ],
    images: photo("iphone-14-128gb")
  },
  {
    name: "iPhone 13 128GB",
    slug: "iphone-13-128gb",
    category: "iPhone",
    model: "A2633",
    storage: "128GB",
    priceGHS: 8900,
    compareAtPriceGHS: 9800,
    stock: 25,
    description:
      "The iPhone 13 remains one of the most beloved smartphones in Ghana. Offering Cinematic mode video, brilliant Super Retina XDR brightness in tropical sun, and outstanding battery endurance.\n\nPowered by the A15 Bionic chip, all your business apps, MoMo transactions, and multimedia run with signature fluid speed. Brand new in factory-sealed box with full 1-year coverage.",
    specs: {
      display: "6.1-inch Super Retina XDR OLED (2532 x 1170)",
      chip: "A15 Bionic chip with 4-core GPU",
      camera: "Dual 12MP camera with sensor-shift optical image stabilization",
      battery: "Up to 19 hours video playback",
      weight: "174 grams",
      connectivity: "Lightning, 5G, Wi-Fi 6",
      waterResistance: "IP68"
    },
    warranty: "1 Year Apple Warranty",
    condition: "New",
    rating: 4.75,
    reviewCount: 165,
    featured: false,
    tags: "deal,bestseller",
    displayOrder: 5,
    colors: [
      { name: "Midnight", hex: "#1D232A", images: photo("iphone-13-128gb") },
      { name: "Blue", hex: "#2C5D88", images: photo("iphone-13-128gb") }
    ],
    images: photo("iphone-13-128gb")
  },

  // ─── 2. IPADS ─────────────────────────────────────────────────────────────
  {
    name: 'iPad Pro 12.9" M2 256GB',
    slug: "ipad-pro-12-9-m2-256gb",
    category: "iPad",
    model: "A2436",
    storage: "256GB",
    priceGHS: 14200,
    compareAtPriceGHS: null,
    stock: 12,
    description:
      "iPad Pro 12.9-inch with the M2 chip delivers astounding performance and extreme dynamic range. The Liquid Retina XDR display features 1,000,000:1 contrast ratio, ideal for HDR photo editing, architectural rendering, and film coloring.\n\nWith Apple Pencil hover support, Pro cameras with LiDAR scanner, and Thunderbolt connectivity, this is the ultimate modular workstation for Ghanaian creatives and enterprise executives.",
    specs: {
      display: "12.9-inch Liquid Retina XDR mini-LED (2732 x 2048) at 264 ppi, 1600 nits peak HDR",
      chip: "Apple M2 chip with 8-core CPU and 10-core GPU",
      camera: "12MP Wide + 10MP Ultra Wide rear cameras, 12MP TrueDepth front with Center Stage",
      battery: "Up to 10 hours of surfing the web on Wi-Fi or watching video",
      weight: "682 grams",
      connectivity: "Thunderbolt / USB 4, Wi-Fi 6E, Bluetooth 5.3"
    },
    warranty: "1 Year Apple Warranty",
    condition: "New",
    rating: 4.95,
    reviewCount: 64,
    featured: false,
    tags: "pro,featured",
    displayOrder: 1,
    colors: [
      { name: "Space Gray", hex: "#4E4F52", images: photo("ipad-pro-12-9-m2-256gb") },
      { name: "Silver", hex: "#E3E4E5", images: photo("ipad-pro-12-9-m2-256gb") }
    ],
    images: photo("ipad-pro-12-9-m2-256gb")
  },
  {
    name: 'iPad Air 11" M2 128GB',
    slug: "ipad-air-11-m2-128gb",
    category: "iPad",
    model: "A2902",
    storage: "128GB",
    priceGHS: 8500,
    compareAtPriceGHS: null,
    stock: 24,
    description:
      "Now supercharged by the Apple M2 chip, iPad Air delivers sensational performance and versatile portability. It features a brilliant 11-inch Liquid Retina display with anti-reflective coating and True Tone.\n\nTake notes in university lectures, sketch blueprints, or produce multitrack music in Logic Pro for iPad. Pairs flawlessly with Apple Pencil Pro and Magic Keyboard.",
    specs: {
      display: "11-inch Liquid Retina LED (2360 x 1640) at 264 ppi with P3 wide color",
      chip: "Apple M2 chip with 8-core CPU and 9-core GPU",
      camera: "12MP Wide rear camera, landscape 12MP Ultra Wide front camera",
      battery: "Up to 10 hours battery life",
      weight: "462 grams",
      connectivity: "USB-C, Wi-Fi 6E, Bluetooth 5.3"
    },
    warranty: "1 Year Apple Warranty",
    condition: "New",
    rating: 4.88,
    reviewCount: 45,
    featured: false,
    tags: "new,bestseller",
    displayOrder: 2,
    colors: [
      { name: "Space Gray", hex: "#535457", images: photo("ipad-air-11-m2-128gb") },
      { name: "Starlight", hex: "#E5E1D8", images: photo("ipad-air-11-m2-128gb") },
      { name: "Blue", hex: "#C7D8E2", images: photo("ipad-air-11-m2-128gb") }
    ],
    images: photo("ipad-air-11-m2-128gb")
  },
  {
    name: "iPad 10th Gen 64GB",
    slug: "ipad-10th-gen-64gb",
    category: "iPad",
    model: "A2696",
    storage: "64GB",
    priceGHS: 6200,
    compareAtPriceGHS: null,
    stock: 40,
    description:
      "Colorfully reimagined and more capable than ever, the 10th generation iPad features an all-screen design with a 10.9-inch Liquid Retina display. Powered by the A14 Bionic chip, it delivers fast performance for coursework, video calls, and gaming.\n\nThe landscape 12MP Ultra Wide front camera with Center Stage keeps you perfectly centered on Zoom and FaceTime calls. The go-to modern tablet for Ghanaian families, students, and young professionals.",
    specs: {
      display: "10.9-inch Liquid Retina display (2360 x 1640) at 264 ppi",
      chip: "A14 Bionic chip with 4-core GPU and 16-core Neural Engine",
      camera: "12MP Wide back camera, landscape 12MP Ultra Wide front camera",
      battery: "Up to 10 hours",
      weight: "477 grams",
      connectivity: "USB-C, Wi-Fi 6, Touch ID on top button"
    },
    warranty: "1 Year Apple Warranty",
    condition: "New",
    rating: 4.8,
    reviewCount: 135,
    featured: true,
    tags: "featured,bestseller,popular",
    displayOrder: 3,
    colors: [
      { name: "Silver", hex: "#E3E4E5", images: photo("ipad-10th-gen-64gb") },
      { name: "Blue", hex: "#5B8FB9", images: photo("ipad-10th-gen-64gb") },
      { name: "Yellow", hex: "#F3DC74", images: photo("ipad-10th-gen-64gb") }
    ],
    images: photo("ipad-10th-gen-64gb")
  },
  {
    name: "iPad mini 6 64GB",
    slug: "ipad-mini-6-64gb",
    category: "iPad",
    model: "A2567",
    storage: "64GB",
    priceGHS: 5400,
    compareAtPriceGHS: null,
    stock: 15,
    description:
      "Mega power in mini size. The iPad mini 6 features an 8.3-inch Liquid Retina display that fits comfortably in one hand. Driven by the A15 Bionic chip, it breezes through spreadsheets, digital books, and flight logs.\n\nSupports Apple Pencil (2nd gen) with magnetic wireless pairing. The ultimate pocketable powerhouse for medical practitioners, field agents, and pilots in Ghana.",
    specs: {
      display: "8.3-inch Liquid Retina display (2266 x 1488) at 326 ppi with True Tone",
      chip: "A15 Bionic chip with 6-core CPU and 5-core GPU",
      camera: "12MP Wide back camera, 12MP Ultra Wide front camera with Center Stage",
      battery: "Up to 10 hours",
      weight: "293 grams",
      connectivity: "USB-C, Wi-Fi 6, Bluetooth 5.0"
    },
    warranty: "1 Year Apple Warranty",
    condition: "New",
    rating: 4.78,
    reviewCount: 52,
    featured: false,
    tags: "compact",
    displayOrder: 4,
    colors: [
      { name: "Space Gray", hex: "#4C4D50", images: photo("ipad-mini-6-64gb") },
      { name: "Purple", hex: "#DDD2E3", images: photo("ipad-mini-6-64gb") }
    ],
    images: photo("ipad-mini-6-64gb")
  },

  // ─── 3. MACS ──────────────────────────────────────────────────────────────
  {
    name: 'MacBook Pro 14" M3 Pro',
    slug: "macbook-pro-14-m3-pro",
    category: "Mac",
    model: "A2992",
    storage: "512GB",
    priceGHS: 28500,
    compareAtPriceGHS: null,
    stock: 8,
    description:
      "MacBook Pro 14-inch blasts ahead with M3 Pro, an extremely advanced chip built on 3-nanometer technology. Featuring groundbreaking GPU architecture with Dynamic Caching, it renders complex 3D scenes and compiles massive codebases in seconds.\n\nEquipped with the breathtaking Liquid Retina XDR display offering 1,000 nits sustained SDR brightness, an array of pro ports (HDMI, SDXC, MagSafe 3), and up to 18 hours of real battery life, this is the definitive machine for Ghanaian developers and creators.",
    specs: {
      display: "14.2-inch Liquid Retina XDR (3024 x 1964), 120Hz ProMotion, 1600 nits peak HDR",
      chip: "Apple M3 Pro: 11-core CPU, 14-core GPU, 18GB Unified Memory",
      battery: "Up to 18 hours Apple TV app movie playback, 70W USB-C Power Adapter",
      weight: "1.61 kg",
      connectivity: "Three Thunderbolt 4 ports, HDMI port, SDXC card slot, MagSafe 3, headphone jack, Wi-Fi 6E"
    },
    warranty: "1 Year Apple Warranty",
    condition: "New",
    rating: 4.98,
    reviewCount: 38,
    featured: false,
    tags: "pro,flagship",
    displayOrder: 1,
    colors: [
      { name: "Space Black", hex: "#2E2F33", images: photo("macbook-pro-14-m3-pro") },
      { name: "Silver", hex: "#E2E3E4", images: photo("macbook-pro-14-m3-pro") }
    ],
    images: photo("macbook-pro-14-m3-pro")
  },
  {
    name: 'MacBook Air 15" M3 256GB',
    slug: "macbook-air-15-m3-256gb",
    category: "Mac",
    model: "A3114",
    storage: "256GB",
    priceGHS: 19800,
    compareAtPriceGHS: null,
    stock: 14,
    description:
      "Lean. Mean. M3 machine. MacBook Air 15-inch gives you an expansive Liquid Retina display in an impossibly thin aluminum enclosure under 12 millimeters. Powered by the M3 chip, it delivers up to 1.6x faster speed than M1.\n\nWith a six-speaker sound system featuring Spatial Audio, 1080p FaceTime HD camera, and completely silent fanless design, it effortlessly bridges all-day office productivity with high-fidelity entertainment.",
    specs: {
      display: "15.3-inch Liquid Retina display (2880 x 1864) with 500 nits brightness and P3 color",
      chip: "Apple M3 chip with 8-core CPU and 10-core GPU, 8GB Unified Memory",
      battery: "Up to 18 hours battery life, 35W Dual USB-C Port Compact Power Adapter",
      weight: "1.51 kg",
      connectivity: "MagSafe 3, two Thunderbolt / USB 4 ports, 3.5mm headphone jack, Wi-Fi 6E"
    },
    warranty: "1 Year Apple Warranty",
    condition: "New",
    rating: 4.9,
    reviewCount: 48,
    featured: false,
    tags: "new,bestseller",
    displayOrder: 2,
    colors: [
      { name: "Midnight", hex: "#1C242F", images: photo("macbook-air-15-m3-256gb") },
      { name: "Starlight", hex: "#E8E2D6", images: photo("macbook-air-15-m3-256gb") }
    ],
    images: photo("macbook-air-15-m3-256gb")
  },
  {
    name: 'MacBook Air 13" M3 256GB',
    slug: "macbook-air-13-m3-256gb",
    category: "Mac",
    model: "A3113",
    storage: "256GB",
    priceGHS: 16500,
    compareAtPriceGHS: null,
    stock: 28,
    description:
      "The world's favorite laptop just reached a new level. The 13-inch MacBook Air with M3 combines ultra-light mobility with fierce capability, gliding into your backpack without weighing you down.\n\nNow supporting up to two external displays with the laptop lid closed, it's the ultimate machine for remote work in Accra coffee shops or university halls. Silent, fast, and engineered for all-day stamina.",
    specs: {
      display: "13.6-inch Liquid Retina display (2560 x 1664) with 500 nits brightness",
      chip: "Apple M3 chip with 8-core CPU and 8-core GPU",
      battery: "Up to 18 hours battery life, MagSafe 3 charging",
      weight: "1.24 kg",
      connectivity: "MagSafe 3, two Thunderbolt ports, support for two external displays, Wi-Fi 6E"
    },
    warranty: "1 Year Apple Warranty",
    condition: "New",
    rating: 4.92,
    reviewCount: 92,
    featured: true,
    tags: "featured,bestseller,popular",
    displayOrder: 3,
    colors: [
      { name: "Space Gray", hex: "#525357", images: photo("macbook-air-13-m3-256gb") },
      { name: "Silver", hex: "#E2E3E5", images: photo("macbook-air-13-m3-256gb") },
      { name: "Midnight", hex: "#1C242F", images: photo("macbook-air-13-m3-256gb") }
    ],
    images: photo("macbook-air-13-m3-256gb")
  },
  {
    name: 'iMac 24" M3',
    slug: "imac-24-m3",
    category: "Mac",
    model: "A2874",
    storage: "256GB",
    priceGHS: 18900,
    compareAtPriceGHS: null,
    stock: 9,
    description:
      "Transform any desk in your home or office into a stunning design statement. The 24-inch iMac with M3 features an astonishing 4.5K Retina display with over a billion colors and 500 nits of brightness.\n\nOnly 11.5mm thin, it includes studio-quality three-microphone array, six-speaker sound with Dolby Atmos, and 1080p FaceTime HD camera. Includes color-matched Magic Keyboard and Magic Mouse.",
    specs: {
      display: "24-inch 4.5K Retina display (4480 x 2520) at 218 ppi with True Tone",
      chip: "Apple M3 chip with 8-core CPU and 8-core GPU",
      weight: "4.43 kg",
      connectivity: "Two Thunderbolt / USB 4 ports, Wi-Fi 6E, Bluetooth 5.3"
    },
    warranty: "1 Year Apple Warranty",
    condition: "New",
    rating: 4.86,
    reviewCount: 29,
    featured: false,
    tags: "desktop",
    displayOrder: 4,
    colors: [
      { name: "Blue", hex: "#4D748E", images: photo("imac-24-m3") },
      { name: "Green", hex: "#638A73", images: photo("imac-24-m3") },
      { name: "Silver", hex: "#DCDDDF", images: photo("imac-24-m3") }
    ],
    images: photo("imac-24-m3")
  },
  {
    name: "Mac mini M2",
    slug: "mac-mini-m2",
    category: "Mac",
    model: "A2686",
    storage: "256GB",
    priceGHS: 9800,
    compareAtPriceGHS: null,
    stock: 16,
    description:
      "More muscle. More hustle. Mac mini with M2 packs the speed you need to get more done faster. From rich presentations to immersive gaming, M2 flies through work and play.\n\nWith a wide array of ports, hook up your favorite display, keyboard, and mouse. It fits into any desk arrangement, making it the most cost-effective gateway to Apple Silicon desktop power.",
    specs: {
      chip: "Apple M2 chip with 8-core CPU and 10-core GPU, 8GB Unified Memory",
      storage: "256GB SSD",
      weight: "1.18 kg",
      connectivity: "Two Thunderbolt 4 ports, two USB-A ports, HDMI, Gigabit Ethernet, headphone jack"
    },
    warranty: "1 Year Apple Warranty",
    condition: "New",
    rating: 4.82,
    reviewCount: 34,
    featured: false,
    tags: "desktop,value",
    displayOrder: 5,
    colors: [
      { name: "Silver", hex: "#E0E1E3", images: photo("mac-mini-m2") }
    ],
    images: photo("mac-mini-m2")
  },

  // ─── 4. WATCHES ───────────────────────────────────────────────────────────
  {
    name: "Apple Watch Ultra 2",
    slug: "apple-watch-ultra-2",
    category: "Watch",
    model: "A2986",
    storage: "64GB",
    priceGHS: 9200,
    compareAtPriceGHS: null,
    stock: 11,
    description:
      "The most rugged and capable Apple Watch pushes the limits once again. Powered by the all-new S9 SiP, it brings double tap gesture control and the brightest Apple display ever at 3000 nits.\n\nBuilt inside a 49mm aerospace-grade titanium case with 100m water resistance, customizable Action button, and precision dual-frequency GPS. Built for extreme athletic endurance and outdoor adventure.",
    specs: {
      display: "49mm Always-On Retina LTPO OLED (3000 nits peak)",
      chip: "S9 SiP with 64-bit dual-core processor and 4-core Neural Engine",
      battery: "Up to 36 hours normal use, up to 72 hours in Low Power Mode",
      weight: "61.4 grams",
      waterResistance: "Water resistant 100m, dive certified to 40m (EN13319)"
    },
    warranty: "1 Year Apple Warranty",
    condition: "New",
    rating: 4.96,
    reviewCount: 42,
    featured: false,
    tags: "rugged,pro",
    displayOrder: 1,
    colors: [
      { name: "Titanium with Orange Ocean Band", hex: "#C5C5C7", images: photo("apple-watch-ultra-2") },
      { name: "Titanium with Trail Loop", hex: "#A8A8AA", images: photo("apple-watch-ultra-2") }
    ],
    images: photo("apple-watch-ultra-2")
  },
  {
    name: "Apple Watch Series 9 45mm",
    slug: "apple-watch-series-9-45mm",
    category: "Watch",
    model: "A2980",
    storage: "64GB",
    priceGHS: 5800,
    compareAtPriceGHS: null,
    stock: 26,
    description:
      "Smarter. Brighter. Mightier. Apple Watch Series 9 features the magical double tap gesture, an even brighter display up to 2000 nits, and Precision Finding for iPhone 15.\n\nKeep track of your heart rate, blood oxygen, sleep stages, and daily workout rings. Your essential personal wellness partner, delivered straight to your door across Ghana.",
    specs: {
      display: "45mm Always-On Retina display (up to 2000 nits brightness)",
      chip: "S9 SiP with double-tap gesture support and on-device Siri",
      battery: "Up to 18 hours, fast charging to 80% in 45 minutes",
      weight: "38.7 grams (aluminum)",
      waterResistance: "50m water resistant, IP6X dust resistant"
    },
    warranty: "1 Year Apple Warranty",
    condition: "New",
    rating: 4.87,
    reviewCount: 75,
    featured: true,
    tags: "featured,bestseller",
    displayOrder: 2,
    colors: [
      { name: "Midnight", hex: "#1D232A", images: photo("apple-watch-series-9-45mm") },
      { name: "Starlight", hex: "#F3EDE2", images: photo("apple-watch-series-9-45mm") },
      { name: "Silver", hex: "#E1E2E4", images: photo("apple-watch-series-9-45mm") }
    ],
    images: photo("apple-watch-series-9-45mm")
  },
  {
    name: "Apple Watch SE 2 40mm",
    slug: "apple-watch-se-2-40mm",
    category: "Watch",
    model: "A2722",
    storage: "32GB",
    priceGHS: 3400,
    compareAtPriceGHS: null,
    stock: 32,
    description:
      "All the essentials to help you stay motivated, active, and connected. Apple Watch SE packs key fitness tracking, heart rate notifications, Fall Detection, and Crash Detection into an affordable package.\n\nWater resistant to 50 meters with swimming stroke detection and customized workout views. The best value smartwatch for daily Ghana fitness routines.",
    specs: {
      display: "40mm Retina LTPO OLED display (1000 nits)",
      chip: "S8 SiP with 64-bit dual-core processor",
      battery: "Up to 18 hours battery life",
      weight: "26.4 grams",
      waterResistance: "50m water resistance"
    },
    warranty: "1 Year Apple Warranty",
    condition: "New",
    rating: 4.75,
    reviewCount: 88,
    featured: false,
    tags: "value,bestseller",
    displayOrder: 3,
    colors: [
      { name: "Midnight", hex: "#1C2329", images: photo("apple-watch-se-2-40mm") },
      { name: "Starlight", hex: "#F3EDE0", images: photo("apple-watch-se-2-40mm") }
    ],
    images: photo("apple-watch-se-2-40mm")
  },

  // ─── 5. AIRPODS & AUDIO ───────────────────────────────────────────────────
  {
    name: "AirPods Pro 2 (USB-C)",
    slug: "airpods-pro-2-usb-c",
    category: "AirPods",
    model: "A3047",
    storage: null,
    priceGHS: 3200,
    compareAtPriceGHS: 3600,
    stock: 45,
    description:
      "AirPods Pro 2 feature up to 2x more Active Noise Cancellation, Adaptive Audio that tailors noise control to your environment, and Transparency mode so you can hear traffic and conversations around you.\n\nNow equipped with a USB-C charging case with MagSafe, precision speaker finder, and IP54 dust and sweat resistance. Elevates Afrobeats, podcasts, and business calls to an immersive acoustic summit.",
    specs: {
      chip: "Apple H2 headphone chip in earbuds, Apple U1 chip in MagSafe charging case",
      battery: "Up to 6 hours listening with ANC, up to 30 hours total with charging case",
      connectivity: "Bluetooth 5.3, USB-C, MagSafe, Apple Watch charger support",
      waterResistance: "IP54 dust, sweat, and water resistant (AirPods and case)"
    },
    warranty: "1 Year Apple Warranty",
    condition: "New",
    rating: 4.93,
    reviewCount: 180,
    featured: true,
    tags: "featured,bestseller,deal",
    displayOrder: 1,
    colors: [
      { name: "White", hex: "#F7F7F7", images: photo("airpods-pro-2-usb-c") }
    ],
    images: photo("airpods-pro-2-usb-c")
  },
  {
    name: "AirPods 3rd Gen",
    slug: "airpods-3rd-gen",
    category: "AirPods",
    model: "A2565",
    storage: null,
    priceGHS: 2100,
    compareAtPriceGHS: null,
    stock: 30,
    description:
      "Featuring personalized Spatial Audio with dynamic head tracking, AirPods 3 place sound all around you for 3D theater-like acoustics. The contoured design features a shorter stem with force sensor controls.\n\nSweat and water resistant for workouts in the gym and jogs in tropical heat. Fast charging yields 1 hour of listening time in just 5 minutes.",
    specs: {
      chip: "H1 headphone chip",
      battery: "Up to 6 hours listening time, up to 30 hours with Lightning / MagSafe case",
      connectivity: "Bluetooth 5.0",
      waterResistance: "IPX4 sweat and water resistant"
    },
    warranty: "1 Year Apple Warranty",
    condition: "New",
    rating: 4.79,
    reviewCount: 65,
    featured: false,
    tags: "popular",
    displayOrder: 2,
    colors: [
      { name: "White", hex: "#FAFAFA", images: photo("airpods-3rd-gen") }
    ],
    images: photo("airpods-3rd-gen")
  },
  {
    name: "AirPods Max",
    slug: "airpods-max",
    category: "AirPods",
    model: "A2096",
    storage: null,
    priceGHS: 7400,
    compareAtPriceGHS: null,
    stock: 8,
    description:
      "The ultimate over-ear personal listening experience. Apple-designed 40mm dynamic drivers produce high-fidelity audio with ultra-low distortion across the entire audible range.\n\nCrafted with a breathable knit mesh canopy and memory foam acoustic ear cushions for plush comfort. Pro-level Active Noise Cancellation and Transparency mode at the twist of the Digital Crown.",
    specs: {
      chip: "Apple H1 headphone chip in each ear cup",
      battery: "Up to 20 hours listening time with ANC on",
      weight: "384.8 grams",
      connectivity: "Bluetooth 5.0, Smart Case"
    },
    warranty: "1 Year Apple Warranty",
    condition: "New",
    rating: 4.91,
    reviewCount: 31,
    featured: false,
    tags: "luxury,flagship",
    displayOrder: 3,
    colors: [
      { name: "Space Gray", hex: "#39393A", images: photo("airpods-max") },
      { name: "Silver", hex: "#E3E4E5", images: photo("airpods-max") },
      { name: "Sky Blue", hex: "#A8BDCC", images: photo("airpods-max") }
    ],
    images: photo("airpods-max")
  },

  // ─── 6. TV & HOME ─────────────────────────────────────────────────────────
  {
    name: "Apple TV 4K 128GB",
    slug: "apple-tv-4k-128gb",
    category: "TV & Home",
    model: "A2843",
    storage: "128GB",
    priceGHS: 2400,
    compareAtPriceGHS: null,
    stock: 22,
    description:
      "Apple TV 4K brings the best of TV together with your favorite Apple devices and services. Powered by the A15 Bionic chip, it delivers smooth navigation, HDR10+, and Dolby Vision cinematic 4K.\n\nComes with Gigabit Ethernet, Thread networking support for your smart home, and the Siri Remote with USB-C touch-enabled clickpad.",
    specs: {
      chip: "A15 Bionic chip",
      storage: "128GB",
      videoOutput: "2160p 4K, HDR10+, Dolby Vision at up to 60 fps",
      connectivity: "HDMI 2.1, Wi-Fi 6, Gigabit Ethernet, Thread mesh networking, Bluetooth 5.0"
    },
    warranty: "1 Year Apple Warranty",
    condition: "New",
    rating: 4.88,
    reviewCount: 39,
    featured: false,
    tags: "entertainment",
    displayOrder: 1,
    colors: [
      { name: "Black", hex: "#1C1D1F", images: photo("apple-tv-4k-128gb") }
    ],
    images: photo("apple-tv-4k-128gb")
  },
  {
    name: "HomePod 2nd Gen",
    slug: "homepod-2nd-gen",
    category: "TV & Home",
    model: "A2632",
    storage: null,
    priceGHS: 4100,
    compareAtPriceGHS: null,
    stock: 12,
    description:
      "HomePod is an acoustic powerhouse. Advanced computational audio delivers rich bass, deep details, and breathtaking Spatial Audio that fills any room.\n\nWorks effortlessly with your Apple devices. Hand off audio from your iPhone, intercom throughout the house, and automate temperature and humidity with built-in sensors.",
    specs: {
      audio: "High-excursion 4-inch woofer, five horn-loaded beamforming tweeters",
      sensors: "Sound Recognition, Temperature and humidity sensor, Accelerometer",
      connectivity: "Wi-Fi 802.11n, Thread, Bluetooth 5.0",
      weight: "2.3 kg"
    },
    warranty: "1 Year Apple Warranty",
    condition: "New",
    rating: 4.84,
    reviewCount: 22,
    featured: false,
    tags: "smart-home",
    displayOrder: 2,
    colors: [
      { name: "Midnight", hex: "#22252A", images: photo("homepod-2nd-gen") },
      { name: "White", hex: "#F5F5F7", images: photo("homepod-2nd-gen") }
    ],
    images: photo("homepod-2nd-gen")
  },
  {
    name: "HomePod mini",
    slug: "homepod-mini",
    category: "TV & Home",
    model: "A2374",
    storage: null,
    priceGHS: 1600,
    compareAtPriceGHS: null,
    stock: 28,
    description:
      "Jam-packed with innovation, HomePod mini delivers unexpectedly big sound for a speaker of its compact size. Standing at just 3.3 inches tall, it easily finds a home on any desk or nightstand.\n\nPair two together for immersive stereo sound, or spread multiple around your living space for multi-room synchronized music.",
    specs: {
      audio: "Full-range driver and dual passive radiators for deep bass",
      connectivity: "Wi-Fi 802.11n, Thread, Bluetooth 5.0",
      weight: "345 grams"
    },
    warranty: "1 Year Apple Warranty",
    condition: "New",
    rating: 4.76,
    reviewCount: 44,
    featured: false,
    tags: "value,smart-home",
    displayOrder: 3,
    colors: [
      { name: "Space Gray", hex: "#3B3C3E", images: photo("homepod-mini") },
      { name: "Blue", hex: "#2B5270", images: photo("homepod-mini") },
      { name: "White", hex: "#F3F4F5", images: photo("homepod-mini") }
    ],
    images: photo("homepod-mini")
  },

  // ─── 7. ACCESSORIES ───────────────────────────────────────────────────────
  {
    name: "Apple Pencil Pro",
    slug: "apple-pencil-pro",
    category: "Accessories",
    model: "A2538",
    storage: null,
    priceGHS: 1850,
    compareAtPriceGHS: null,
    stock: 35,
    description:
      "Apple Pencil Pro adds even more magical capabilities to bring your ideas to life. Squeeze to summon tool palettes, rotate the barrel for precise brush control with barrel roll, and feel haptic feedback confirms each action.\n\nNow includes Find My support so you can easily locate your Pencil in your home or bag. Magnetically attaches, pairs, and charges on compatible iPad models.",
    specs: {
      sensors: "Squeeze gesture sensor, Gyroscope for barrel roll, Haptic engine",
      connectivity: "Bluetooth, magnetic wireless charging, Find My support",
      weight: "19.15 grams"
    },
    warranty: "1 Year Apple Warranty",
    condition: "New",
    rating: 4.94,
    reviewCount: 37,
    featured: false,
    tags: "creative,accessory",
    displayOrder: 1,
    colors: [
      { name: "White", hex: "#FFFFFF", images: photo("apple-pencil-pro") }
    ],
    images: photo("apple-pencil-pro")
  },
  {
    name: "MagSafe Charger",
    slug: "magsafe-charger",
    category: "Accessories",
    model: "A2140",
    storage: null,
    priceGHS: 650,
    compareAtPriceGHS: null,
    stock: 50,
    description:
      "The MagSafe Charger makes wireless charging a snap. Perfectly aligned magnets attach to your iPhone 12, 13, 14, or 15 to provide faster wireless charging up to 15W.\n\nMaintains Qi wireless compatibility, so you can also use it to charge your AirPods with wireless charging case.",
    specs: {
      chargingOutput: "Up to 15W peak wireless delivery (recommended 20W USB-C adapter)",
      cableLength: "1 meter integrated USB-C cable"
    },
    warranty: "1 Year Apple Warranty",
    condition: "New",
    rating: 4.82,
    reviewCount: 92,
    featured: false,
    tags: "bestseller,charging",
    displayOrder: 2,
    colors: [
      { name: "Silver & White", hex: "#EEEEEE", images: photo("magsafe-charger") }
    ],
    images: photo("magsafe-charger")
  },
  {
    name: "AirTag 4-pack",
    slug: "airtag-4-pack",
    category: "Accessories",
    model: "A2187",
    storage: null,
    priceGHS: 1450,
    compareAtPriceGHS: null,
    stock: 40,
    description:
      "Keep track of keys, backpack, luggage, and wallet in the Find My app. Precision Finding with Ultra Wideband technology leads you straight to your nearby AirTag.\n\nOne-tap setup instantly connects AirTag with your iPhone or iPad. Built-in speaker plays sounds, and replaceable CR2032 battery lasts over a year.",
    specs: {
      connectivity: "Bluetooth, U1 chip for Ultra Wideband Precision Finding, NFC tap for Lost Mode",
      battery: "User-replaceable CR2032 coin cell (lasts 1+ year)",
      waterResistance: "IP67 (maximum depth of 1 meter up to 30 minutes)"
    },
    warranty: "1 Year Apple Warranty",
    condition: "New",
    rating: 4.9,
    reviewCount: 68,
    featured: false,
    tags: "bestseller,tracking",
    displayOrder: 3,
    colors: [
      { name: "White & Polished Stainless Steel", hex: "#FFFFFF", images: photo("airtag-4-pack") }
    ],
    images: photo("airtag-4-pack")
  }
];

async function main() {
  console.log("🇬🇭 Starting I-Store physical Apple hardware seed...");

  let productsCount = 0;
  let reviewsCount = 0;
  const categoryCounts = {};
  const featuredSlugs = [];

  for (const item of PRODUCTS_DATA) {
    // Track stats
    categoryCounts[item.category] = (categoryCounts[item.category] || 0) + 1;
    if (item.featured) {
      featuredSlugs.push(item.slug);
    }

    // 1. Check or Upsert Product
    const existing = await prisma.product.findUnique({
      where: { slug: item.slug }
    });

    let productRecord;
    const productPayload = {
      name: item.name,
      slug: item.slug,
      brand: "Apple",
      category: item.category,
      model: item.model,
      storage: item.storage,
      colors: safeJsonStringify(item.colors),
      priceGHS: item.priceGHS,
      compareAtPriceGHS: item.compareAtPriceGHS,
      stock: item.stock,
      description: item.description,
      specs: safeJsonStringify(item.specs),
      warranty: item.warranty,
      condition: item.condition,
      rating: item.rating,
      reviewCount: item.reviewCount,
      featured: item.featured,
      tags: item.tags,
      isActive: true,
      displayOrder: item.displayOrder
    };

    if (existing) {
      productRecord = await prisma.product.update({
        where: { slug: item.slug },
        data: productPayload
      });
    } else {
      productRecord = await prisma.product.create({
        data: productPayload
      });
    }
    productsCount++;

    // 2. Clean up existing product images & recreate
    await prisma.productImage.deleteMany({
      where: { productId: productRecord.id }
    });

    for (let i = 0; i < item.images.length; i++) {
      await prisma.productImage.create({
        data: {
          productId: productRecord.id,
          url: item.images[i],
          alt: `${item.name} image ${i + 1}`,
          isPrimary: i === 0,
          displayOrder: i + 1
        }
      });
    }

    // 3. Clean up existing reviews & recreate exactly 3 reviews with Ghanaian names
    await prisma.review.deleteMany({
      where: { productId: productRecord.id }
    });

    for (let r = 0; r < 3; r++) {
      const reviewerName =
        GHANAIAN_REVIEWERS[(productsCount * 3 + r) % GHANAIAN_REVIEWERS.length];
      const template =
        REVIEW_TEMPLATES[(productsCount * 2 + r) % REVIEW_TEMPLATES.length];

      await prisma.review.create({
        data: {
          productId: productRecord.id,
          authorName: reviewerName,
          rating: template.rating,
          title: template.title,
          body: template.body
        }
      });
      reviewsCount++;
    }
  }

  // Check if admin already exists in Supabase
  const adminEmail = "admin@ghanaapps.shop";
  const adminPassword = "ChangeMe123!";

  let supabaseAdminUser;

  // Try to create — if exists, fetch
  const { data: existing } = await supabaseAdmin.auth.admin.listUsers();
  const found = existing?.users?.find((u) => u.email === adminEmail);

  if (found) {
    supabaseAdminUser = found;
  } else {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      user_metadata: { name: "Admin", phone: "+233200000000" }
    });
    if (error) throw error;
    supabaseAdminUser = data.user;
  }

  // Upsert Prisma user
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      supabaseId: supabaseAdminUser.id,
      name: "Admin",
      phone: "+233200000000",
      role: "admin",
      isActive: true
    },
    create: {
      supabaseId: supabaseAdminUser.id,
      name: "Admin",
      email: adminEmail,
      phone: "+233200000000",
      role: "admin",
      isActive: true
    }
  });

  console.log("🔑 ADMIN LOGIN");
  console.log("   Email:    " + adminEmail);
  console.log("   Password: " + adminPassword);
  console.log("   ⚠️  Change this password immediately after first login.");

  // Optional Demo Orders for testing (Gated by SEED_DEMO_ORDERS === "true")
  if (process.env.SEED_DEMO_ORDERS === "true") {
    console.log("🛒 Seeding demo orders for testing...");
    const sampleProducts = await prisma.product.findMany({ take: 5, include: { images: true } });
    const demoCustomers = [
      { name: "Kwame Mensah", phone: "+233241234567", email: "kwame.m@example.com", region: "Greater Accra", city: "East Legon" },
      { name: "Ama Serwaa", phone: "+233242345678", email: "ama.s@example.com", region: "Ashanti", city: "Kumasi" },
      { name: "Kofi Boateng", phone: "+233243456789", email: "kofi.b@example.com", region: "Western", city: "Takoradi" },
      { name: "Akosua Adjei", phone: "+233244567890", email: "akosua.a@example.com", region: "Central", city: "Cape Coast" }
    ];

    const statuses = ["pending", "paid", "paid", "shipped", "shipped", "delivered", "delivered", "cancelled"];
    for (let i = 0; i < 10; i++) {
      const cust = demoCustomers[i % demoCustomers.length];
      const prod = sampleProducts[i % sampleProducts.length];
      const status = statuses[i % statuses.length];
      const daysAgo = (i * 3) % 28;
      const orderDate = new Date();
      orderDate.setDate(orderDate.getDate() - daysAgo);

      const subtotal = prod.priceGHS * 1;
      const deliveryFee = 25;
      const total = subtotal + deliveryFee;

      const orderData = {
        subtotalGHS: subtotal,
        deliveryFeeGHS: deliveryFee,
        totalGHS: total,
        deliveryRegion: cust.region,
        shippingAddress: safeJsonStringify({
          fullName: cust.name,
          phone: cust.phone,
          region: cust.region,
          city: cust.city,
          gpsAddress: "GA-183-9021",
          landmark: "Near Market"
        }),
        status,
        paymentChannel: i % 3 === 0 ? "card" : "mobile_money",
        paymentReference: `gha_demo_${Date.now()}_${i}`,
        createdAt: orderDate,
        updatedAt: orderDate,
        items: {
          create: [
            {
              productId: prod.id,
              name: prod.name,
              priceGHS: prod.priceGHS,
              qty: 1,
              image: prod.images[0]?.url
            }
          ]
        }
      };

      if (status === "paid" || status === "shipped" || status === "delivered") {
        orderData.paidAt = new Date(orderDate.getTime() + 1000 * 60 * 15);
      }
      if (status === "shipped" || status === "delivered") {
        orderData.shippedAt = new Date(orderDate.getTime() + 1000 * 60 * 60 * 24);
        orderData.courier = "DHL";
        orderData.trackingNumber = `DHL${Date.now()}${i}`;
      }
      if (status === "delivered") {
        orderData.deliveredAt = new Date(orderDate.getTime() + 1000 * 60 * 60 * 48);
      }
      if (status === "cancelled") {
        orderData.cancelledAt = new Date(orderDate.getTime() + 1000 * 60 * 60 * 2);
        orderData.adminNote = "Cancelled per customer request";
      }

      await prisma.order.create({ data: orderData });
    }

    console.log("⚠️  Demo orders seeded (SEED_DEMO_ORDERS=true)");
    console.log("   Set SEED_DEMO_ORDERS=false or omit it in production.");
  }

  // Print Summary Table
  console.log("\n=======================================================");
  console.log("✅ SEED COMPLETED SUCCESSFULLY");
  console.log("=======================================================");
  console.log(`📦 Total Products Seeded: ${productsCount}`);
  console.log(`💬 Total Reviews Seeded:  ${reviewsCount} (3 per product)`);
  console.log("🔑 Admin login: admin@ghanaapps.shop / ChangeMe123!");
  console.log("\n📁 Category Breakdown:");
  for (const [cat, count] of Object.entries(categoryCounts)) {
    console.log(`   • ${cat.padEnd(14)}: ${count} products`);
  }
  console.log("\n🌟 Featured Hero Slugs (for Home Carousel):");
  featuredSlugs.forEach((slug, idx) => {
    console.log(`   ${idx + 1}. ${slug}`);
  });
  console.log("=======================================================\n");
}

main()
  .catch((err) => {
    console.error("❌ Seed failed with error:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
