import { Product, Review } from "../types";

const PHOTO_BASE =
  "https://nxycejiuwpbocaiqwsdt.supabase.co/storage/v1/object/public/product-images/products";

const img = (file: string) => `${PHOTO_BASE}/${file}.jpg?v=apple4`;

function makeReviews(productId: string, baseIdx: number): Review[] {
  const reviewers = [
    "Kwame Mensah",
    "Ama Serwaa",
    "Kofi Boateng",
    "Akosua Adjei",
    "Yaw Darko",
    "Abena Owusu",
    "Kojo Asante",
    "Efua Mensimah"
  ];
  const templates = [
    {
      title: "Sealed Apple box, express delivery in Accra",
      body: "Unboxed this today in East Legon — 100% factory sealed with official Apple warranty verified online. Camera Control and display brightness are next-level.",
      rating: 5
    },
    {
      title: "Unbelievable battery life and build quality",
      body: "Upgraded through I-Dynamic and paid effortlessly with MTN MoMo. Easily lasts two full days of heavy work and 4K video capture.",
      rating: 5
    },
    {
      title: "Best flagship release up to October 2026",
      body: "Delivered to Kumasi in protective packaging. Performance, thermal efficiency, and finish quality are unmatched.",
      rating: 5
    }
  ];

  return [0, 1, 2].map((i) => {
    const t = templates[(baseIdx + i) % templates.length];
    return {
      id: `rev-${productId}-${i + 1}`,
      productId,
      authorName: reviewers[(baseIdx * 2 + i) % reviewers.length],
      rating: t.rating,
      title: t.title,
      body: t.body,
      createdAt: new Date(Date.UTC(2026, 9, 15 - i * 3)).toISOString()
    };
  });
}

/**
 * Latest Apple hardware and accessory catalog through October 2026:
 * - iPhone 16, 16 Pro, 16 Pro Max, 17 Air, 17 Pro, 17 Pro Max, 18, 18 Pro, 18 Pro Max & iPhone Duo
 * - Beats MagSafe Cases with Camera Control, Kickstand Case, TechWoven Case, MagSafe Wallet, 25W MagSafe, AirTag 2
 * - Apple Watch Ultra 3, Apple Watch Series 12, Apple Watch SE 3
 * - AirPods Pro 3 (H3), AirPods 4 (ANC), AirPods Max (USB-C)
 * - iPad Pro 13" M5 Tandem OLED & MacBook Pro 16" M5 Max
 */
const RAW_CATALOG_2026: Omit<Product, "reviews" | "isActive" | "updatedAt">[] = [
  // ─── IPHONE 18 SERIES & IPHONE DUO (OCT 2026) ────────────────────────────
  {
    id: "prod-iphone-18-pro-max-512gb",
    name: "iPhone 18 Pro Max 512GB",
    slug: "iphone-18-pro-max-512gb",
    brand: "Apple",
    category: "iPhone",
    model: "A3406",
    storage: "512GB",
    priceGHS: 26500,
    compareAtPriceGHS: 28200,
    stock: 20,
    description:
      "The October 2026 pinnacle of Apple engineering. iPhone 18 Pro Max is forged in Grade 5 aerospace titanium and powered by the 2-nanometer A20 Pro chip with 16GB Unified Memory for instant on-device Apple Intelligence.\n\nFeaturing an expansive 6.9-inch Super Retina XDR display with under-display Face ID, anti-reflective Ceramic Shield 2, and a triple 48MP Pro camera array with 10x optical tetraprism zoom and tactile Camera Control 2.",
    specs: {
      display: "6.9-inch Super Retina XDR Always-On OLED (2868 x 1320), 120Hz ProMotion, 3000 nits peak",
      chip: "Apple A20 Pro (2nm) with 6-core GPU and 32-core Neural Engine",
      camera: "Triple 48MP Pro system: 48MP Fusion (variable aperture), 48MP Ultra Wide, 48MP 10x Tetraprism Telephoto",
      battery: "Up to 35 hours video playback, 45W USB-C fast charge & 25W MagSafe",
      connectivity: "Thunderbolt 4 / USB-C, Wi-Fi 7, 5G, Bluetooth 6.0, Emergency SOS via Satellite",
      waterResistance: "IP68 (6 meters up to 30 minutes)"
    },
    warranty: "1 Year Apple Warranty",
    condition: "New",
    rating: 4.98,
    reviewCount: 214,
    featured: true,
    tags: ["new", "featured", "bestseller", "deal", "2026"],
    displayOrder: 1,
    createdAt: "2026-10-12T10:00:00.000Z",
    colors: [
      {
        name: "Burgundy Titanium",
        hex: "#5E2D38",
        images: [img("iphone-18-pro-max-512gb-burgundy-titanium")]
      },
      {
        name: "Glacier Titanium",
        hex: "#BFCAD0",
        images: [img("iphone-18-pro-max-512gb-glacier-titanium")]
      },
      {
        name: "Black Titanium",
        hex: "#232426",
        images: [img("iphone-18-pro-max-512gb-black-titanium")]
      },
      {
        name: "Silver Titanium",
        hex: "#E4E5E7",
        images: [img("iphone-18-pro-max-512gb-silver-titanium")]
      }
    ],
    images: [
      img("iphone-18-pro-max-512gb"),
      img("iphone-18-pro-max-512gb-burgundy-titanium"),
      img("iphone-18-pro-max-512gb-glacier-titanium"),
      img("iphone-18-pro-max-512gb-black-titanium"),
      img("iphone-18-pro-max-512gb-silver-titanium")
    ]
  },
  {
    id: "prod-iphone-duo-1tb",
    name: "iPhone Duo 1TB",
    slug: "iphone-duo-1tb",
    brand: "Apple",
    category: "iPhone",
    model: "A3490",
    storage: "1TB",
    priceGHS: 34900,
    compareAtPriceGHS: 36800,
    stock: 9,
    description:
      "Meet iPhone Duo — Apple's revolutionary dual-horizon foldable flagship released in late 2026. Precision-milled with a zero-gap liquid-metal titanium hinge, it unfolds from a sleek 6.3-inch flagship iPhone into a breathtaking 7.9-inch creaseless Tandem OLED studio canvas.\n\nRun three spatial apps side-by-side, sketch with Apple Pencil Pro support, and shoot studio-grade 48MP ProRes video using the outer display as a live director's monitor.",
    specs: {
      display: "7.9-inch Unfolded Tandem OLED (2480 x 2200) + 6.3-inch Super Retina XDR Cover Display, 120Hz ProMotion",
      chip: "Apple A20 Pro Ultra chip with dual vapor-chamber cooling & 16GB Unified Memory",
      camera: "Triple 48MP Pro Camera System with Dual-Screen Live Preview & Camera Control 2",
      battery: "Dual-cell high-density silicon-carbon battery (up to 32 hours video playback)",
      hinge: "Aerospace Liquid-Metal Zero-Gap Titanium Hinge rated for 500,000 folds",
      connectivity: "USB-C Thunderbolt 4, Wi-Fi 7, Dual eSIM, 5G Ultra Wideband"
    },
    warranty: "1 Year Apple Warranty",
    condition: "New",
    rating: 4.99,
    reviewCount: 128,
    featured: true,
    tags: ["new", "featured", "bestseller", "deal", "foldable", "2026"],
    displayOrder: 2,
    createdAt: "2026-10-14T12:00:00.000Z",
    colors: [
      {
        name: "Night Sky Titanium",
        hex: "#222933",
        images: [img("iphone-duo-1tb-night-sky-titanium")]
      },
      {
        name: "Star White Titanium",
        hex: "#F2F1EC",
        images: [img("iphone-duo-1tb-star-white-titanium")]
      }
    ],
    images: [
      img("iphone-duo-1tb"),
      img("iphone-duo-1tb-night-sky-titanium"),
      img("iphone-duo-1tb-star-white-titanium")
    ]
  },
  {
    id: "prod-iphone-18-pro-256gb",
    name: "iPhone 18 Pro 256GB",
    slug: "iphone-18-pro-256gb",
    brand: "Apple",
    category: "iPhone",
    model: "A3402",
    storage: "256GB",
    priceGHS: 22900,
    compareAtPriceGHS: null,
    stock: 24,
    description:
      "iPhone 18 Pro brings the full power of the 2nm A20 Pro architecture and triple 48MP camera system into a compact 6.3-inch titanium frame. Designed for creators who demand pro-level 4K 120fps Dolby Vision and tactile Camera Control in a single-handed design.",
    specs: {
      display: "6.3-inch Super Retina XDR OLED (2622 x 1206) with 120Hz ProMotion & Under-Display Face ID",
      chip: "Apple A20 Pro (2nm) with 6-core GPU",
      camera: "Triple 48MP Pro camera system with 5x Tetraprism Telephoto & Camera Control 2",
      battery: "Up to 30 hours video playback",
      connectivity: "USB-C (USB 3 10Gb/s), Wi-Fi 7, Bluetooth 6.0, 5G"
    },
    warranty: "1 Year Apple Warranty",
    condition: "New",
    rating: 4.94,
    reviewCount: 118,
    featured: false,
    tags: ["new", "bestseller", "2026"],
    displayOrder: 3,
    createdAt: "2026-10-10T09:00:00.000Z",
    colors: [
      {
        name: "Glacier Titanium",
        hex: "#BFCAD0",
        images: [img("iphone-18-pro-256gb-glacier-titanium")]
      },
      {
        name: "Burgundy Titanium",
        hex: "#5E2D38",
        images: [img("iphone-18-pro-256gb-burgundy-titanium")]
      },
      {
        name: "Black Titanium",
        hex: "#232426",
        images: [img("iphone-18-pro-256gb-black-titanium")]
      },
      {
        name: "Silver Titanium",
        hex: "#E4E5E7",
        images: [img("iphone-18-pro-256gb-silver-titanium")]
      }
    ],
    images: [
      img("iphone-18-pro-256gb"),
      img("iphone-18-pro-256gb-glacier-titanium"),
      img("iphone-18-pro-256gb-burgundy-titanium"),
      img("iphone-18-pro-256gb-black-titanium"),
      img("iphone-18-pro-256gb-silver-titanium")
    ]
  },
  {
    id: "prod-iphone-18-256gb",
    name: "iPhone 18 256GB",
    slug: "iphone-18-256gb",
    brand: "Apple",
    category: "iPhone",
    model: "A3400",
    storage: "256GB",
    priceGHS: 18400,
    compareAtPriceGHS: null,
    stock: 30,
    description:
      "iPhone 18 now features a 120Hz ProMotion Super Retina XDR display, the A20 Bionic chip for effortless Apple Intelligence, the customizable Action Button, and tactile Camera Control. Color-infused glass and aerospace aluminum make it durable and unmistakably modern.",
    specs: {
      display: "6.2-inch Super Retina XDR OLED with 120Hz ProMotion & Dynamic Island",
      chip: "Apple A20 Bionic chip with 16-core Neural Engine",
      camera: "48MP Dual Fusion camera system with 2x optical-quality Telephoto & Spatial Video",
      battery: "Up to 26 hours video playback",
      connectivity: "USB-C, Wi-Fi 7, 5G, MagSafe 25W"
    },
    warranty: "1 Year Apple Warranty",
    condition: "New",
    rating: 4.9,
    reviewCount: 89,
    featured: false,
    tags: ["new", "popular", "2026"],
    displayOrder: 4,
    createdAt: "2026-10-08T09:00:00.000Z",
    colors: [
      { name: "Mist Blue", hex: "#9BB6CE", images: [img("iphone-18-256gb-mist-blue")] },
      { name: "Lavender", hex: "#C8BCE0", images: [img("iphone-18-256gb-lavender")] },
      { name: "Sage", hex: "#A7B8A5", images: [img("iphone-18-256gb-sage")] },
      { name: "Obsidian Black", hex: "#2E3135", images: [img("iphone-18-256gb-obsidian-black")] }
    ],
    images: [
      img("iphone-18-256gb"),
      img("iphone-18-256gb-mist-blue"),
      img("iphone-18-256gb-lavender"),
      img("iphone-18-256gb-sage"),
      img("iphone-18-256gb-obsidian-black")
    ]
  },

  // ─── IPHONE 17 SERIES ────────────────────────────────────────────────────
  {
    id: "prod-iphone-17-pro-max-256gb",
    name: "iPhone 17 Pro Max 256GB",
    slug: "iphone-17-pro-max-256gb",
    brand: "Apple",
    category: "iPhone",
    model: "A3296",
    storage: "256GB",
    priceGHS: 23200,
    compareAtPriceGHS: 24800,
    stock: 22,
    description:
      "iPhone 17 Pro Max elevates mobile photography with a full trio of 48MP rear cameras and a 24MP Center Stage TrueDepth front camera. Powered by the A19 Pro chip with vapor-chamber cooling, it sustains peak frame rates for AAA gaming and 4K 120fps ProRes workflows.",
    specs: {
      display: "6.9-inch Super Retina XDR OLED with anti-reflective coating & 120Hz ProMotion",
      chip: "Apple A19 Pro chip with 6-core GPU and 12GB Unified Memory",
      camera: "48MP Fusion Main, 48MP Ultra Wide, 48MP 5x Tetraprism Telephoto, 24MP Front",
      battery: "Up to 33 hours video playback, 25W MagSafe wireless charging",
      connectivity: "USB-C (10Gb/s), Wi-Fi 7, Bluetooth 5.4, 5G"
    },
    warranty: "1 Year Apple Warranty",
    condition: "New",
    rating: 4.95,
    reviewCount: 176,
    featured: true,
    tags: ["featured", "bestseller", "deal"],
    displayOrder: 5,
    createdAt: "2026-09-15T10:00:00.000Z",
    colors: [
      {
        name: "Cosmic Orange",
        hex: "#D96B27",
        images: [img("iphone-17-pro-max-256gb-cosmic-orange")]
      },
      {
        name: "Deep Blue",
        hex: "#2B3B4E",
        images: [img("iphone-17-pro-max-256gb-deep-blue")]
      },
      {
        name: "Silver",
        hex: "#E3E4E6",
        images: [img("iphone-17-pro-max-256gb-silver")]
      }
    ],
    images: [
      img("iphone-17-pro-max-256gb"),
      img("iphone-17-pro-max-256gb-cosmic-orange"),
      img("iphone-17-pro-max-256gb-deep-blue"),
      img("iphone-17-pro-max-256gb-silver")
    ]
  },
  {
    id: "prod-iphone-17-pro-256gb",
    name: "iPhone 17 Pro 256GB",
    slug: "iphone-17-pro-256gb",
    brand: "Apple",
    category: "iPhone",
    model: "A3292",
    storage: "256GB",
    priceGHS: 19900,
    compareAtPriceGHS: null,
    stock: 19,
    description:
      "Engineered with the A19 Pro chip, 12GB RAM, and all-48MP rear cameras in a sleek 6.3-inch profile. iPhone 17 Pro delivers studio-quality Spatial Video, ProRes Log recording, and all-day battery endurance.",
    specs: {
      display: "6.3-inch Super Retina XDR OLED with 120Hz ProMotion",
      chip: "Apple A19 Pro chip with 6-core GPU",
      camera: "Triple 48MP Pro camera system with 5x Optical Zoom",
      battery: "Up to 28 hours video playback",
      connectivity: "USB-C, Wi-Fi 7, 5G"
    },
    warranty: "1 Year Apple Warranty",
    condition: "New",
    rating: 4.91,
    reviewCount: 104,
    featured: false,
    tags: ["bestseller"],
    displayOrder: 6,
    createdAt: "2026-09-12T10:00:00.000Z",
    colors: [
      {
        name: "Deep Blue",
        hex: "#2B3B4E",
        images: [img("iphone-17-pro-256gb-deep-blue")]
      },
      {
        name: "Cosmic Orange",
        hex: "#D96B27",
        images: [img("iphone-17-pro-256gb-cosmic-orange")]
      },
      {
        name: "Silver",
        hex: "#E3E4E6",
        images: [img("iphone-17-pro-256gb-silver")]
      }
    ],
    images: [
      img("iphone-17-pro-256gb"),
      img("iphone-17-pro-256gb-deep-blue"),
      img("iphone-17-pro-256gb-cosmic-orange"),
      img("iphone-17-pro-256gb-silver")
    ]
  },
  {
    id: "prod-iphone-17-air-256gb",
    name: "iPhone 17 Air 256GB",
    slug: "iphone-17-air-256gb",
    brand: "Apple",
    category: "iPhone",
    model: "A3290",
    storage: "256GB",
    priceGHS: 17800,
    compareAtPriceGHS: null,
    stock: 26,
    description:
      "The thinnest iPhone ever crafted at just 5.5mm. iPhone 17 Air combines featherweight titanium-aluminum architecture with a 6.6-inch 120Hz ProMotion display, A19 silicon, and a 48MP Fusion camera.",
    specs: {
      display: "6.6-inch Super Retina XDR OLED, 120Hz ProMotion, 5.5mm ultra-thin profile",
      chip: "Apple A19 chip with Apple C1 5G modem",
      camera: "48MP Fusion camera with 2x Telephoto & 24MP TrueDepth front camera",
      battery: "Up to 24 hours video playback",
      weight: "145 grams"
    },
    warranty: "1 Year Apple Warranty",
    condition: "New",
    rating: 4.89,
    reviewCount: 92,
    featured: false,
    tags: ["new", "slim", "popular"],
    displayOrder: 7,
    createdAt: "2026-09-10T10:00:00.000Z",
    colors: [
      { name: "Sky Blue", hex: "#BFD4E6", images: [img("iphone-17-air-256gb-sky-blue")] },
      { name: "Light Gold", hex: "#EFE4D2", images: [img("iphone-17-air-256gb-light-gold")] },
      { name: "Cloud White", hex: "#F5F6F8", images: [img("iphone-17-air-256gb-cloud-white")] },
      { name: "Space Black", hex: "#222427", images: [img("iphone-17-air-256gb-space-black")] }
    ],
    images: [
      img("iphone-17-air-256gb"),
      img("iphone-17-air-256gb-sky-blue"),
      img("iphone-17-air-256gb-light-gold"),
      img("iphone-17-air-256gb-cloud-white"),
      img("iphone-17-air-256gb-space-black")
    ]
  },

  // ─── IPHONE 16 SERIES ────────────────────────────────────────────────────
  {
    id: "prod-iphone-16-pro-max-256gb",
    name: "iPhone 16 Pro Max 256GB",
    slug: "iphone-16-pro-max-256gb",
    brand: "Apple",
    category: "iPhone",
    model: "A3293",
    storage: "256GB",
    priceGHS: 20500,
    compareAtPriceGHS: 21900,
    stock: 28,
    description:
      "Built for Apple Intelligence and forged in Grade 5 titanium, iPhone 16 Pro Max features a larger 6.9-inch Super Retina XDR display with the thinnest borders on any Apple product. Powered by the A18 Pro chip, it introduces tactile Camera Control, 48MP Ultra Wide photography, and 4K 120fps Dolby Vision cinematic capture with studio-quality four-mic Audio Mix.",
    specs: {
      display: "6.9-inch Super Retina XDR OLED (2868 x 1320) at 460 ppi, 120Hz ProMotion",
      chip: "A18 Pro chip with 6-core GPU and 16-core Neural Engine",
      camera: "48MP Fusion, 48MP Ultra Wide, 12MP 5x Tetraprism Telephoto, Camera Control button",
      battery: "Up to 33 hours video playback, 25W MagSafe fast wireless charging",
      connectivity: "USB-C (USB 3 up to 10Gb/s), Wi-Fi 7, 5G, Bluetooth 5.3",
      waterResistance: "IP68 (6 meters up to 30 minutes)"
    },
    warranty: "1 Year Apple Warranty",
    condition: "New",
    rating: 4.94,
    reviewCount: 245,
    featured: true,
    tags: ["featured", "bestseller", "deal"],
    displayOrder: 8,
    createdAt: "2026-08-20T10:00:00.000Z",
    colors: [
      {
        name: "Desert Titanium",
        hex: "#C4B19B",
        images: [img("iphone-16-pro-max-256gb-desert-titanium")]
      },
      {
        name: "White Titanium",
        hex: "#F2F2ED",
        images: [img("iphone-16-pro-max-256gb-white-titanium")]
      },
      {
        name: "Black Titanium",
        hex: "#28292A",
        images: [img("iphone-16-pro-max-256gb-black-titanium")]
      },
      {
        name: "Natural Titanium",
        hex: "#9E978E",
        images: [img("iphone-16-pro-max-256gb-natural-titanium")]
      }
    ],
    images: [
      img("iphone-16-pro-max-256gb"),
      img("iphone-16-pro-max-256gb-desert-titanium"),
      img("iphone-16-pro-max-256gb-white-titanium"),
      img("iphone-16-pro-max-256gb-black-titanium"),
      img("iphone-16-pro-max-256gb-natural-titanium")
    ]
  },
  {
    id: "prod-iphone-16-pro-128gb",
    name: "iPhone 16 Pro 128GB",
    slug: "iphone-16-pro-128gb",
    brand: "Apple",
    category: "iPhone",
    model: "A3287",
    storage: "128GB",
    priceGHS: 17500,
    compareAtPriceGHS: null,
    stock: 25,
    description:
      "iPhone 16 Pro upgrades to a 6.3-inch Super Retina XDR display and brings the 5x Tetraprism Telephoto lens and Camera Control button to the Pro size. Powered by the A18 Pro chip for console-level gaming and ProRes video.",
    specs: {
      display: "6.3-inch Super Retina XDR OLED with 120Hz ProMotion",
      chip: "A18 Pro chip with 6-core GPU",
      camera: "48MP Fusion, 48MP Ultra Wide, 12MP 5x Telephoto with Camera Control",
      battery: "Up to 27 hours video playback",
      connectivity: "USB-C, Wi-Fi 7, 5G"
    },
    warranty: "1 Year Apple Warranty",
    condition: "New",
    rating: 4.9,
    reviewCount: 138,
    featured: false,
    tags: ["bestseller"],
    displayOrder: 9,
    createdAt: "2026-08-18T10:00:00.000Z",
    colors: [
      {
        name: "Natural Titanium",
        hex: "#9E978E",
        images: [img("iphone-16-pro-128gb-natural-titanium")]
      },
      {
        name: "Black Titanium",
        hex: "#28292A",
        images: [img("iphone-16-pro-128gb-black-titanium")]
      },
      {
        name: "Desert Titanium",
        hex: "#C4B19B",
        images: [img("iphone-16-pro-128gb-desert-titanium")]
      }
    ],
    images: [
      img("iphone-16-pro-128gb"),
      img("iphone-16-pro-128gb-natural-titanium"),
      img("iphone-16-pro-128gb-black-titanium"),
      img("iphone-16-pro-128gb-desert-titanium")
    ]
  },
  {
    id: "prod-iphone-16-128gb",
    name: "iPhone 16 128GB",
    slug: "iphone-16-128gb",
    brand: "Apple",
    category: "iPhone",
    model: "A3284",
    storage: "128GB",
    priceGHS: 14500,
    compareAtPriceGHS: 15400,
    stock: 34,
    description:
      "iPhone 16 is built from the ground up for Apple Intelligence with the fast A18 chip, customizable Action button, and Camera Control for quick visual intelligence and zoom. Its vertical dual-camera layout captures spatial photos and videos for immersive playback.",
    specs: {
      display: "6.1-inch Super Retina XDR OLED with Dynamic Island",
      chip: "A18 chip with 5-core GPU and 16-core Neural Engine",
      camera: "48MP Fusion with 2x Telephoto + 12MP Ultra Wide with Macro photography",
      battery: "Up to 22 hours video playback",
      connectivity: "USB-C, Wi-Fi 7, 25W MagSafe"
    },
    warranty: "1 Year Apple Warranty",
    condition: "New",
    rating: 4.88,
    reviewCount: 162,
    featured: false,
    tags: ["bestseller", "deal"],
    displayOrder: 10,
    createdAt: "2026-08-15T10:00:00.000Z",
    colors: [
      { name: "Ultramarine", hex: "#6B88C8", images: [img("iphone-16-128gb-ultramarine")] },
      { name: "Pink", hex: "#FCE1E4", images: [img("iphone-16-128gb-pink")] },
      { name: "Teal", hex: "#92B4B6", images: [img("iphone-16-128gb-teal")] },
      { name: "Black", hex: "#353839", images: [img("iphone-16-128gb-black")] }
    ],
    images: [
      img("iphone-16-128gb"),
      img("iphone-16-128gb-ultramarine"),
      img("iphone-16-128gb-pink"),
      img("iphone-16-128gb-teal"),
      img("iphone-16-128gb-black")
    ]
  },

  // ─── LATEST WATCHES (UP TO OCT 2026) ─────────────────────────────────────
  {
    id: "prod-apple-watch-ultra-3",
    name: "Apple Watch Ultra 3 (49mm)",
    slug: "apple-watch-ultra-3",
    brand: "Apple",
    category: "Watch",
    model: "A3186",
    storage: "64GB",
    priceGHS: 12400,
    compareAtPriceGHS: 13200,
    stock: 16,
    description:
      "The ultimate sports and adventure watch updated for 2026. Apple Watch Ultra 3 introduces a blazing 3500-nit wide-angle LTPO3 Always-On display, two-way off-grid satellite messaging, hypertension & sleep apnea notifications, and a new Satin Black Titanium finish alongside Natural Titanium.",
    specs: {
      display: "49mm Wide-Angle Always-On LTPO3 OLED (3500 nits peak) with flat sapphire crystal",
      chip: "S11 SiP with 4-core Neural Engine, 5G RedCap & Satellite SOS",
      battery: "Up to 42 hours normal use, up to 80 hours in Low Power Mode",
      waterResistance: "100m water resistant, EN13319 recreational scuba diving to 40m",
      sensors: "Blood Oxygen, ECG, Hypertension Alerts, Sleep Apnea Detection, Depth Gauge"
    },
    warranty: "1 Year Apple Warranty",
    condition: "New",
    rating: 4.98,
    reviewCount: 112,
    featured: true,
    tags: ["new", "featured", "bestseller", "deal", "2026"],
    displayOrder: 1,
    createdAt: "2026-10-11T10:00:00.000Z",
    colors: [
      {
        name: "Satin Black Titanium with Trail Loop",
        hex: "#252629",
        images: [img("apple-watch-ultra-2-titanium-with-trail-loop")]
      },
      {
        name: "Natural Titanium with Orange Ocean Band",
        hex: "#C5C5C7",
        images: [img("apple-watch-ultra-2-titanium-with-orange-ocean-band")]
      }
    ],
    images: [
      img("apple-watch-ultra-2-titanium-with-trail-loop"),
      img("apple-watch-ultra-2-titanium-with-orange-ocean-band")
    ]
  },
  {
    id: "prod-apple-watch-series-12-46mm",
    name: "Apple Watch Series 12 46mm",
    slug: "apple-watch-series-12-46mm",
    brand: "Apple",
    category: "Watch",
    model: "A3180",
    storage: "64GB",
    priceGHS: 7400,
    compareAtPriceGHS: null,
    stock: 28,
    description:
      "Thinner, wider, and smarter than ever. Apple Watch Series 12 features a 46mm wide-angle OLED screen in a razor-thin 9.7mm case, powered by the S11 SiP with wrist-flick gestures, Vitals tracking, sleep apnea alerts, and 30-minute fast charging to 80%.",
    specs: {
      display: "46mm Wide-Angle Always-On Retina LTPO3 OLED (2000 nits)",
      chip: "S11 SiP with on-device Siri, Double Tap & Wrist Flick gesture",
      battery: "Up to 24 hours, fast charge to 80% in 30 minutes",
      waterResistance: "50m water resistant with water temperature & depth sensor"
    },
    warranty: "1 Year Apple Warranty",
    condition: "New",
    rating: 4.93,
    reviewCount: 84,
    featured: false,
    tags: ["new", "bestseller", "2026"],
    displayOrder: 2,
    createdAt: "2026-10-05T10:00:00.000Z",
    colors: [
      { name: "Jet Black", hex: "#141619", images: [img("apple-watch-series-9-45mm-midnight")] },
      { name: "Rose Gold", hex: "#E6C7B8", images: [img("apple-watch-series-9-45mm-starlight")] },
      { name: "Silver Titanium", hex: "#E1E2E4", images: [img("apple-watch-series-9-45mm-silver")] }
    ],
    images: [
      img("apple-watch-series-9-45mm-midnight"),
      img("apple-watch-series-9-45mm-starlight"),
      img("apple-watch-series-9-45mm-silver")
    ]
  },
  {
    id: "prod-apple-watch-se-3-44mm",
    name: "Apple Watch SE 3 44mm",
    slug: "apple-watch-se-3-44mm",
    brand: "Apple",
    category: "Watch",
    model: "A3172",
    storage: "64GB",
    priceGHS: 4200,
    compareAtPriceGHS: null,
    stock: 30,
    description:
      "The 2026 Apple Watch SE 3 pairs the fast S10 chip with Always-On display support, Crash Detection, Workout Buddy coaching, and Family Setup — delivering essential Apple Watch health and safety features at an incredible value.",
    specs: {
      display: "44mm Retina LTPO OLED display (1500 nits)",
      chip: "S10 SiP with Double Tap gesture",
      battery: "Up to 20 hours battery life",
      waterResistance: "50m swimproof"
    },
    warranty: "1 Year Apple Warranty",
    condition: "New",
    rating: 4.85,
    reviewCount: 61,
    featured: false,
    tags: ["new", "value"],
    displayOrder: 3,
    createdAt: "2026-09-25T10:00:00.000Z",
    colors: [
      { name: "Midnight", hex: "#1C2329", images: [img("apple-watch-se-2-40mm-midnight")] },
      { name: "Starlight", hex: "#F3EDE0", images: [img("apple-watch-se-2-40mm-starlight")] }
    ],
    images: [img("apple-watch-se-2-40mm-midnight"), img("apple-watch-se-2-40mm-starlight")]
  },

  // ─── NEW AIRPODS LINEUP (UP TO OCT 2026) ─────────────────────────────────
  {
    id: "prod-airpods-pro-3",
    name: "AirPods Pro 3 (USB-C, H3)",
    slug: "airpods-pro-3",
    brand: "Apple",
    category: "AirPods",
    model: "A3247",
    storage: null,
    priceGHS: 3950,
    compareAtPriceGHS: 4400,
    stock: 42,
    description:
      "Re-engineered around the new Apple H3 acoustic chip, AirPods Pro 3 deliver up to 3x stronger Active Noise Cancellation, in-ear optical heart-rate and body-temperature monitoring during workouts, real-time Live Translation, and clinical-grade Hearing Health features.\n\nComplete with an ultra-compact USB-C MagSafe Case featuring the U2 chip for 60m Precision Finding and built-in Find My speaker.",
    specs: {
      chip: "Apple H3 headphone chip + Apple U2 Ultra Wideband chip in MagSafe case",
      sensors: "In-ear optical heart-rate sensor, skin temperature sensor, speech-detecting accelerometer",
      battery: "Up to 7.5 hours listening with ANC, up to 34 hours total with USB-C MagSafe case",
      connectivity: "Bluetooth 5.4, Lossless Wireless Audio, USB-C, MagSafe & Apple Watch charger",
      waterResistance: "IP55 dust, sweat, and water resistant"
    },
    warranty: "1 Year Apple Warranty",
    condition: "New",
    rating: 4.97,
    reviewCount: 195,
    featured: true,
    tags: ["new", "featured", "bestseller", "deal", "2026"],
    displayOrder: 1,
    createdAt: "2026-10-09T10:00:00.000Z",
    colors: [{ name: "White", hex: "#F7F7F7", images: [img("airpods-pro-2-usb-c-white")] }],
    images: [img("airpods-pro-2-usb-c-white")]
  },
  {
    id: "prod-airpods-4-anc",
    name: "AirPods 4 with Active Noise Cancellation",
    slug: "airpods-4-anc",
    brand: "Apple",
    category: "AirPods",
    model: "A3055",
    storage: null,
    priceGHS: 2750,
    compareAtPriceGHS: null,
    stock: 38,
    description:
      "For the first time in an open-ear design, AirPods 4 bring Active Noise Cancellation, Adaptive Audio, and Transparency mode without silicone ear tips. Powered by the H2 chip with Voice Isolation and a wireless USB-C charging case with a built-in Find My speaker.",
    specs: {
      chip: "Apple H2 headphone chip",
      audio: "Active Noise Cancellation, Adaptive Audio, Transparency mode, Personalized Spatial Audio",
      battery: "Up to 5 hours with ANC, up to 30 hours with wireless USB-C charging case",
      waterResistance: "IP54 dust, sweat, and water resistant"
    },
    warranty: "1 Year Apple Warranty",
    condition: "New",
    rating: 4.91,
    reviewCount: 132,
    featured: false,
    tags: ["new", "bestseller", "2026"],
    displayOrder: 2,
    createdAt: "2026-09-20T10:00:00.000Z",
    colors: [{ name: "White", hex: "#FAFAFA", images: [img("airpods-3rd-gen-white")] }],
    images: [img("airpods-3rd-gen-white")]
  },
  {
    id: "prod-airpods-max-usb-c",
    name: "AirPods Max (USB-C, 2026)",
    slug: "airpods-max-usb-c",
    brand: "Apple",
    category: "AirPods",
    model: "A3184",
    storage: null,
    priceGHS: 8200,
    compareAtPriceGHS: 8900,
    stock: 14,
    description:
      "The updated AirPods Max with USB-C unlocks 24-bit/48kHz Lossless Audio and ultra-low latency for music production and gaming. Finished in refreshed 2026 anodized aluminum colors with pro-level Active Noise Cancellation and Personalized Spatial Audio.",
    specs: {
      chip: "Dual Apple H2-class acoustic processing with USB-C Lossless DAC",
      battery: "Up to 22 hours listening time with ANC and Spatial Audio enabled",
      connectivity: "USB-C digital audio & charging, Bluetooth 5.3",
      weight: "386 grams"
    },
    warranty: "1 Year Apple Warranty",
    condition: "New",
    rating: 4.94,
    reviewCount: 68,
    featured: false,
    tags: ["new", "luxury", "deal"],
    displayOrder: 3,
    createdAt: "2026-09-18T10:00:00.000Z",
    colors: [
      { name: "Midnight", hex: "#2A2E35", images: [img("airpods-max-space-gray")] },
      { name: "Starlight", hex: "#E6E1D6", images: [img("airpods-max-silver")] },
      { name: "Blue", hex: "#A8BDCC", images: [img("airpods-max-sky-blue")] }
    ],
    images: [
      img("airpods-max-space-gray"),
      img("airpods-max-silver"),
      img("airpods-max-sky-blue")
    ]
  },

  // ─── NEW IPHONE ACCESSORIES (BEATS CASE & LATEST GEAR) ───────────────────
  {
    id: "prod-beats-iphone-18-pro-max-case",
    name: "Beats iPhone 18 Pro Max Case with MagSafe & Camera Control",
    slug: "beats-iphone-18-pro-max-case-magsafe",
    brand: "Apple",
    category: "Accessories",
    model: "MW6K3",
    storage: null,
    priceGHS: 980,
    compareAtPriceGHS: 1150,
    stock: 48,
    description:
      "Designed by Beats for the iPhone 16, 17, and 18 Pro Max lineup. Built to protect against drops and scratches with a rugged hardshell polycarbonate back and shock-absorbing thermoplastic sidewalls.\n\nFeatures a sapphire crystal coupled to a conductive layer that communicates finger movements seamlessly to the Camera Control button, an ultra-soft microfiber lining, and perfectly aligned MagSafe magnets.",
    specs: {
      compatibility: "iPhone 18 Pro Max, iPhone 17 Pro Max, iPhone 16 Pro Max",
      cameraControl: "Sapphire crystal cap with conductive touch-sensing layer",
      materials: "Hardshell polycarbonate back, shock-absorbing TPU bumpers, microfiber lining",
      magsafe: "Built-in neodymium magnet array for 25W MagSafe & Qi2.2 accessories"
    },
    warranty: "1 Year Apple Warranty",
    condition: "New",
    rating: 4.95,
    reviewCount: 114,
    featured: true,
    tags: ["new", "featured", "bestseller", "deal", "beats", "accessory", "2026"],
    displayOrder: 1,
    createdAt: "2026-10-13T10:00:00.000Z",
    colors: [
      {
        name: "Bedrock Gray",
        hex: "#4A4C50",
        images: [img("beats-iphone-18-pro-max-case-magsafe-bedrock-gray")]
      },
      {
        name: "Burgundy Clear MagSafe",
        hex: "#5E2D38",
        images: [img("beats-iphone-18-pro-max-case-magsafe-burgundy-clear-magsafe")]
      }
    ],
    images: [
      img("beats-iphone-18-pro-max-case-magsafe"),
      img("beats-iphone-18-pro-max-case-magsafe-bedrock-gray"),
      img("beats-iphone-18-pro-max-case-magsafe-burgundy-clear-magsafe")
    ]
  },
  {
    id: "prod-beats-iphone-pro-kickstand-case",
    name: "Beats iPhone 18 Pro Kickstand Case with MagSafe",
    slug: "beats-iphone-pro-kickstand-case",
    brand: "Apple",
    category: "Accessories",
    model: "MY9N3",
    storage: null,
    priceGHS: 1100,
    compareAtPriceGHS: null,
    stock: 36,
    description:
      "The all-new Beats Kickstand Case with MagSafe and Camera Control features an integrated lanyard cord that doubles as a fold-out landscape kickstand for hands-free video streaming, FaceTime calls, and StandBy desk clock mode.",
    specs: {
      compatibility: "iPhone 18 Pro, iPhone 17 Pro & iPhone Duo",
      standFeature: "Integrated fold-out wrist strap & landscape viewing kickstand",
      cameraControl: "Conductive sapphire crystal Camera Control pass-through",
      magsafe: "Full MagSafe charger and wallet compatibility"
    },
    warranty: "1 Year Apple Warranty",
    condition: "New",
    rating: 4.92,
    reviewCount: 74,
    featured: false,
    tags: ["new", "beats", "accessory", "2026"],
    displayOrder: 2,
    createdAt: "2026-10-07T10:00:00.000Z",
    colors: [
      {
        name: "Pebble Stone Kickstand",
        hex: "#8B7D6B",
        images: [img("beats-iphone-pro-kickstand-case-pebble-stone-kickstand")]
      },
      {
        name: "Bedrock Gray",
        hex: "#4A4C50",
        images: [img("beats-iphone-pro-kickstand-case-bedrock-gray")]
      }
    ],
    images: [
      img("beats-iphone-pro-kickstand-case"),
      img("beats-iphone-pro-kickstand-case-pebble-stone-kickstand"),
      img("beats-iphone-pro-kickstand-case-bedrock-gray")
    ]
  },
  {
    id: "prod-iphone-techwoven-case-magsafe",
    name: "iPhone TechWoven Case with MagSafe & Crossbody Loop",
    slug: "iphone-techwoven-case-magsafe",
    brand: "Apple",
    category: "Accessories",
    model: "MA7E4",
    storage: null,
    priceGHS: 890,
    compareAtPriceGHS: null,
    stock: 44,
    description:
      "Apple's next-generation TechWoven Case replaces FineWoven with an ultra-resilient, stain-resistant micro-engineered woven fabric. Equipped with machined anodized aluminum buttons, sapphire Camera Control button cover, and dual anchor loops for the Apple Crossbody Strap.",
    specs: {
      compatibility: "iPhone 16, 17 & 18 Series",
      material: "100% recycled high-tenacity woven technical textile",
      features: "Crossbody strap anchor points, MagSafe, sapphire Camera Control"
    },
    warranty: "1 Year Apple Warranty",
    condition: "New",
    rating: 4.88,
    reviewCount: 58,
    featured: false,
    tags: ["new", "accessory", "2026"],
    displayOrder: 3,
    createdAt: "2026-10-04T10:00:00.000Z",
    colors: [
      { name: "Burgundy TechWoven", hex: "#5E2D38", images: [img("iphone-techwoven-case-magsafe-burgundy-techwoven")] },
      { name: "Mulberry TechWoven", hex: "#722F4B", images: [img("iphone-techwoven-case-magsafe-mulberry-techwoven")] },
      { name: "Olive TechWoven", hex: "#5C5B3E", images: [img("iphone-techwoven-case-magsafe-olive-techwoven")] }
    ],
    images: [
      img("iphone-techwoven-case-magsafe"),
      img("iphone-techwoven-case-magsafe-burgundy-techwoven"),
      img("iphone-techwoven-case-magsafe-mulberry-techwoven"),
      img("iphone-techwoven-case-magsafe-olive-techwoven")
    ]
  },
  {
    id: "prod-iphone-magsafe-wallet-find-my",
    name: "iPhone MagSafe Wallet with Find My (2026)",
    slug: "iphone-magsafe-wallet-find-my",
    brand: "Apple",
    category: "Accessories",
    model: "MT2N3",
    storage: null,
    priceGHS: 950,
    compareAtPriceGHS: null,
    stock: 40,
    description:
      "Snap up to three cards securely onto the back of your iPhone or Beats MagSafe Case. Built-in NFC Find My integration alerts your iPhone with the exact street location the moment your wallet is separated.",
    specs: {
      capacity: "Up to 3 credit/ID cards with magnetic shielding",
      tracking: "Apple Find My separation alerts and last-known map location",
      compatibility: "All MagSafe-enabled iPhones and Beats/Apple MagSafe Cases"
    },
    warranty: "1 Year Apple Warranty",
    condition: "New",
    rating: 4.86,
    reviewCount: 49,
    featured: false,
    tags: ["new", "accessory", "bestseller"],
    displayOrder: 4,
    createdAt: "2026-09-28T10:00:00.000Z",
    colors: [
      { name: "Obsidian", hex: "#1F2024", images: [img("magsafe-charger-silver-white")] }
    ],
    images: [img("magsafe-charger-silver-white")]
  },
  {
    id: "prod-magsafe-charger-25w-2m",
    name: "MagSafe Charger 25W (2m Braided)",
    slug: "magsafe-charger-25w-2m",
    brand: "Apple",
    category: "Accessories",
    model: "A2580",
    storage: null,
    priceGHS: 850,
    compareAtPriceGHS: null,
    stock: 55,
    description:
      "The latest 25W Qi2.2 MagSafe Charger with an extra-long 2-meter braided USB-C cable. Charges iPhone 16, 17, 18, and iPhone Duo models to 50% in under 30 minutes when paired with a 30W+ USB-C power adapter.",
    specs: {
      chargingOutput: "Up to 25W fast wireless MagSafe & Qi2.2 delivery",
      cableLength: "2 meters woven braided USB-C cable"
    },
    warranty: "1 Year Apple Warranty",
    condition: "New",
    rating: 4.93,
    reviewCount: 83,
    featured: false,
    tags: ["new", "charging", "bestseller"],
    displayOrder: 5,
    createdAt: "2026-09-22T10:00:00.000Z",
    colors: [
      { name: "Silver & White", hex: "#EEEEEE", images: [img("magsafe-charger-silver-white")] }
    ],
    images: [img("magsafe-charger-silver-white")]
  },
  {
    id: "prod-airtag-2nd-gen-4-pack",
    name: "AirTag 2nd Gen (2026) 4-Pack",
    slug: "airtag-2nd-gen-4-pack",
    brand: "Apple",
    category: "Accessories",
    model: "A3187",
    storage: null,
    priceGHS: 1650,
    compareAtPriceGHS: 1850,
    stock: 45,
    description:
      "Equipped with Apple's 2nd-generation Ultra Wideband chip, AirTag 2nd Gen triples Precision Finding range up to 60 meters with directional haptic guidance on iPhone 16/17/18 and Apple Watch Ultra 3.",
    specs: {
      chip: "Apple U2 Ultra Wideband chip (60m Precision Finding range)",
      battery: "Replaceable CR2032 battery (18+ months life)",
      waterResistance: "IP68 water and dust resistant"
    },
    warranty: "1 Year Apple Warranty",
    condition: "New",
    rating: 4.96,
    reviewCount: 97,
    featured: false,
    tags: ["new", "bestseller", "deal", "2026"],
    displayOrder: 6,
    createdAt: "2026-10-02T10:00:00.000Z",
    colors: [
      {
        name: "White & Polished Titanium",
        hex: "#FFFFFF",
        images: [img("airtag-4-pack-white-polished-stainless-steel")]
      }
    ],
    images: [img("airtag-4-pack-white-polished-stainless-steel")]
  },

  // ─── LATEST M5 IPAD & MAC FLAGSHIPS (OCT 2026) ───────────────────────────
  {
    id: "prod-ipad-pro-13-m5-512gb",
    name: 'iPad Pro 13" M5 Tandem OLED 512GB',
    slug: "ipad-pro-13-m5-512gb",
    brand: "Apple",
    category: "iPad",
    model: "A3360",
    storage: "512GB",
    priceGHS: 21500,
    compareAtPriceGHS: 22900,
    stock: 14,
    description:
      "Impossibly thin at 5.1mm and supercharged by the 2026 Apple M5 chip. The 13-inch Ultra Retina XDR Tandem OLED display delivers 1600 nits peak HDR brightness, ProMotion 120Hz, and full Apple Pencil Pro squeeze and barrel-roll support.",
    specs: {
      display: "13-inch Ultra Retina XDR Tandem OLED (2752 x 2064), 120Hz ProMotion",
      chip: "Apple M5 chip with 10-core CPU, 10-core GPU & 16-core Neural Engine",
      connectivity: "Thunderbolt / USB 4, Wi-Fi 7, Bluetooth 5.4",
      weight: "579 grams"
    },
    warranty: "1 Year Apple Warranty",
    condition: "New",
    rating: 4.97,
    reviewCount: 72,
    featured: true,
    tags: ["new", "featured", "pro", "deal", "2026"],
    displayOrder: 1,
    createdAt: "2026-10-06T10:00:00.000Z",
    colors: [
      { name: "Space Black", hex: "#2E2F33", images: [img("ipad-pro-13-m5-512gb-space-black")] },
      { name: "Silver", hex: "#E3E4E5", images: [img("ipad-pro-13-m5-512gb-silver")] }
    ],
    images: [
      img("ipad-pro-13-m5-512gb"),
      img("ipad-pro-13-m5-512gb-space-black"),
      img("ipad-pro-13-m5-512gb-silver")
    ]
  },
  {
    id: "prod-macbook-pro-16-m5-max-1tb",
    name: 'MacBook Pro 16" M5 Max 1TB',
    slug: "macbook-pro-16-m5-max-1tb",
    brand: "Apple",
    category: "Mac",
    model: "A3485",
    storage: "1TB",
    priceGHS: 42500,
    compareAtPriceGHS: null,
    stock: 7,
    description:
      "The ultimate pro laptop for October 2026. MacBook Pro 16-inch with M5 Max features a 16-core CPU, 40-core GPU with hardware ray tracing, 48GB Unified Memory, Thunderbolt 5 ports (120Gb/s), and up to 24 hours of battery life.",
    specs: {
      display: "16.2-inch Liquid Retina XDR display (3456 x 2234), 120Hz ProMotion",
      chip: "Apple M5 Max (16-core CPU, 40-core GPU, 48GB Unified Memory)",
      battery: "Up to 24 hours battery life, 140W USB-C MagSafe 3 fast charge",
      connectivity: "Three Thunderbolt 5 ports, HDMI 2.1, SDXC slot, Wi-Fi 7"
    },
    warranty: "1 Year Apple Warranty",
    condition: "New",
    rating: 4.99,
    reviewCount: 54,
    featured: false,
    tags: ["new", "pro", "flagship", "2026"],
    displayOrder: 1,
    createdAt: "2026-10-03T10:00:00.000Z",
    colors: [
      { name: "Space Black", hex: "#2E2F33", images: [img("macbook-pro-16-m5-max-1tb-space-black")] },
      { name: "Silver", hex: "#E2E3E4", images: [img("macbook-pro-16-m5-max-1tb-silver")] }
    ],
    images: [
      img("macbook-pro-16-m5-max-1tb"),
      img("macbook-pro-16-m5-max-1tb-space-black"),
      img("macbook-pro-16-m5-max-1tb-silver")
    ]
  }
];

export const CATALOG_2026: Product[] = RAW_CATALOG_2026.map((item, idx) => {
  const baseTime = new Date("2026-10-18T18:00:00.000Z").getTime();
  const createdAt = new Date(baseTime - idx * 60 * 1000).toISOString();
  return {
    ...item,
    displayOrder: idx + 1,
    createdAt,
    isActive: true,
    updatedAt: createdAt,
    reviews: makeReviews(item.id, idx)
  };
});
