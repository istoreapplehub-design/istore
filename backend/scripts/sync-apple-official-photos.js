/**
 * Downloads official Apple Store product photographs (including per-color finish
 * variants) directly from Apple's Scene7 CDN (as-images.apple.com), uploads them
 * to the Supabase `product-images` bucket, and updates all ProductImage rows and
 * per-color variant arrays in the database.
 */
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { supabaseAdmin } = require("../src/utils/supabase");
const { safeJsonParse } = require("../src/utils/json");

const BUCKET = "product-images";
const CACHE_BUST = "v=apple2";
const LOCAL_JPEG_DIR = path.join(__dirname, "../../vibe_images/jpeg");

// Official Apple CDN asset IDs per product slug and color finish name
const PRODUCT_APPLE_ASSETS = {
  "iphone-15-pro-max-256gb": {
    hero: "iphone-15-pro-finish-select-202309-6-7inch-naturaltitanium",
    colors: {
      "Natural Titanium": "iphone-15-pro-finish-select-202309-6-7inch-naturaltitanium",
      "Blue Titanium": "iphone-15-pro-finish-select-202309-6-7inch-bluetitanium",
      "White Titanium": "iphone-15-pro-finish-select-202309-6-7inch-whitetitanium",
      "Black Titanium": "iphone-15-pro-finish-select-202309-6-7inch-blacktitanium"
    }
  },
  "iphone-15-pro-128gb": {
    hero: "iphone-15-pro-finish-select-202309-6-1inch-naturaltitanium",
    colors: {
      "Natural Titanium": "iphone-15-pro-finish-select-202309-6-1inch-naturaltitanium",
      "Black Titanium": "iphone-15-pro-finish-select-202309-6-1inch-blacktitanium"
    }
  },
  "iphone-15-128gb": {
    hero: "iphone-15-finish-select-202309-6-1inch-black",
    colors: {
      "Black": "iphone-15-finish-select-202309-6-1inch-black",
      "Blue": "iphone-15-finish-select-202309-6-1inch-blue",
      "Pink": "iphone-15-finish-select-202309-6-1inch-pink"
    }
  },
  "iphone-14-128gb": {
    hero: "iphone-14-finish-select-202209-6-1inch-midnight",
    colors: {
      "Midnight": "iphone-14-finish-select-202209-6-1inch-midnight",
      "Starlight": "iphone-14-finish-select-202209-6-1inch-starlight"
    }
  },
  "iphone-13-128gb": {
    hero: "iphone-13-finish-select-202207-6-1inch-midnight",
    colors: {
      "Midnight": "iphone-13-finish-select-202207-6-1inch-midnight",
      "Blue": "iphone-13-finish-select-202207-6-1inch-blue"
    }
  },
  "ipad-pro-12-9-m2-256gb": {
    hero: "ipad-pro-13-select-wifi-spacegray-202210",
    colors: {
      "Space Gray": "ipad-pro-13-select-wifi-spacegray-202210",
      "Silver": "ipad-pro-13-select-wifi-silver-202210"
    }
  },
  "ipad-air-11-m2-128gb": {
    hero: "ipad-air-storage-select-202405-11inch-space-gray-wifi",
    colors: {
      "Space Gray": "ipad-air-storage-select-202405-11inch-space-gray-wifi",
      "Starlight": "ipad-air-storage-select-202405-11inch-starlight-wifi",
      "Blue": "ipad-air-storage-select-202405-11inch-blue-wifi"
    }
  },
  "ipad-10th-gen-64gb": {
    hero: "ipad-10th-gen-finish-select-202212-silver-wifi",
    colors: {
      "Silver": "ipad-10th-gen-finish-select-202212-silver-wifi",
      "Blue": "ipad-10th-gen-finish-select-202212-blue-wifi",
      "Yellow": "ipad-10th-gen-finish-select-202212-yellow-wifi"
    }
  },
  "ipad-mini-6-64gb": {
    hero: "ipad-mini-select-wifi-space-gray-202109",
    colors: {
      "Space Gray": "ipad-mini-select-wifi-space-gray-202109",
      "Purple": "ipad-mini-select-wifi-purple-202109"
    }
  },
  "macbook-pro-14-m3-pro": {
    hero: "mbp14-m3-max-pro-spaceblack-select-202310",
    colors: {
      "Space Black": "mbp14-m3-max-pro-spaceblack-select-202310",
      "Silver": "mbp14-m3-max-pro-silver-select-202310"
    }
  },
  "macbook-air-15-m3-256gb": {
    hero: "mba15-midnight-select-202306",
    colors: {
      "Midnight": "mba15-midnight-select-202306",
      "Starlight": "mba15-starlight-select-202306"
    }
  },
  "macbook-air-13-m3-256gb": {
    hero: "mba13-spacegray-select-202402",
    colors: {
      "Space Gray": "mba13-spacegray-select-202402",
      "Silver": "mba13-silver-select-202402",
      "Midnight": "mba13-midnight-select-202402"
    }
  },
  "imac-24-m3": {
    hero: "imac-24-no-id-blue-selection-hero-202310",
    colors: {
      "Blue": "imac-24-no-id-blue-selection-hero-202310",
      "Green": "imac-24-no-id-green-selection-hero-202310",
      "Silver": "imac-24-no-id-silver-selection-hero-202310"
    }
  },
  "mac-mini-m2": {
    hero: "mac-mini-hero-202301",
    colors: {
      "Silver": "mac-mini-hero-202301"
    }
  },
  "apple-watch-ultra-2": {
    hero: "watch-card-40-ultra2-202309",
    colors: {
      "Titanium with Orange Ocean Band": "watch-card-40-ultra2-202309",
      "Titanium with Trail Loop": "MT5J3ref_VW_34FR+watch-49-titanium-ultra2_VW_34FR+watch-face-49-alpine-ultra2_VW_34FR"
    }
  },
  "apple-watch-series-9-45mm": {
    hero: "s9-case-unselect-gallery-1-202309",
    colors: {
      "Midnight": "s9-case-unselect-gallery-1-202309",
      "Starlight": "s9-case-unselect-gallery-2-202309",
      "Silver": "s9-case-unselect-gallery-3-202309"
    }
  },
  "apple-watch-se-2-40mm": {
    hero: "se-case-unselect-gallery-1-202309",
    colors: {
      "Midnight": "se-case-unselect-gallery-1-202309",
      "Starlight": "se-case-unselect-gallery-2-202309"
    }
  },
  "airpods-pro-2-usb-c": {
    hero: "MTJV3",
    colors: {
      "White": "MTJV3"
    }
  },
  "airpods-3rd-gen": {
    hero: "MME73",
    colors: {
      "White": "MME73"
    }
  },
  "airpods-max": {
    hero: "airpods-max-select-spacegray-202011",
    colors: {
      "Space Gray": "airpods-max-select-spacegray-202011",
      "Silver": "airpods-max-select-silver-202011",
      "Sky Blue": "airpods-max-select-skyblue-202011"
    }
  },
  "apple-tv-4k-128gb": {
    hero: "apple-tv-4k-hero-select-202210",
    colors: {
      "Black": "apple-tv-4k-hero-select-202210"
    }
  },
  "homepod-2nd-gen": {
    hero: "homepod-select-midnight-202210",
    colors: {
      "Midnight": "homepod-select-midnight-202210",
      "White": "homepod-select-white-202210"
    }
  },
  "homepod-mini": {
    hero: "homepod-mini-select-spacegray-202010",
    colors: {
      "Space Gray": "homepod-mini-select-spacegray-202010",
      "Blue": "homepod-mini-select-blue-202110",
      "White": "homepod-mini-select-white-202010"
    }
  },
  "apple-pencil-pro": {
    hero: "MX2D3",
    colors: {
      "White": "MX2D3"
    }
  },
  "magsafe-charger": {
    hero: "MHXH3",
    colors: {
      "Silver & White": "MHXH3"
    }
  },
  "airtag-4-pack": {
    hero: "MX542",
    colors: {
      "White & Polished Stainless Steel": "MX542"
    }
  }
};

function slugifyColor(name) {
  return String(name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const { execFileSync } = require("child_process");
const ASSET_CACHE_DIR = "/tmp/apple_asset_cache";
if (!fs.existsSync(ASSET_CACHE_DIR)) {
  fs.mkdirSync(ASSET_CACHE_DIR, { recursive: true });
}

async function fetchAppleImageBuffer(assetId) {
  const safeFile = assetId.replace(/[^a-zA-Z0-9_-]/g, "_") + ".jpg";
  const cachePath = path.join(ASSET_CACHE_DIR, safeFile);
  if (fs.existsSync(cachePath)) {
    const stat = fs.statSync(cachePath);
    if (stat.size > 1000) {
      return fs.readFileSync(cachePath);
    }
  }

  const directUrl = `https://as-images.apple.com/is/${assetId}?wid=1000&hei=1000&fmt=jpeg&qlt=92`;
  const cdnUrl = `https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/${assetId}?wid=1000&hei=1000&fmt=jpeg&qlt=92`;

  for (let round = 1; round <= 3; round++) {
    for (const url of [directUrl, cdnUrl]) {
      try {
        const buf = execFileSync("curl", [
          "-sL",
          "--fail",
          "--retry",
          "2",
          "--max-time",
          "25",
          "-A",
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
          url
        ], { maxBuffer: 20 * 1024 * 1024 });

        if (buf && buf.length > 1000) {
          fs.writeFileSync(cachePath, buf);
          return buf;
        }
      } catch {
        // try next URL / round
      }
    }
    await new Promise((r) => setTimeout(r, 1000 * round));
  }
  throw new Error(`Failed to download Apple image for asset: ${assetId}`);
}

async function uploadBufferToSupabase(storagePath, buffer) {
  const { error } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(storagePath, buffer, {
      contentType: "image/jpeg",
      cacheControl: "31536000",
      upsert: true
    });

  if (error) {
    throw new Error(`Supabase upload failed for ${storagePath}: ${error.message}`);
  }

  const { data } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(storagePath);
  return `${data.publicUrl}?${CACHE_BUST}`;
}

async function main() {
  const crypto = require("crypto");
  if (!fs.existsSync(LOCAL_JPEG_DIR)) {
    fs.mkdirSync(LOCAL_JPEG_DIR, { recursive: true });
  }

  const { data: products, error: fetchErr } = await supabaseAdmin
    .from("Product")
    .select("*, images:ProductImage(*)")
    .order("displayOrder", { ascending: true });

  if (fetchErr || !products) {
    throw new Error(`Failed to fetch products from Supabase: ${fetchErr?.message}`);
  }

  console.log(`Syncing official Apple.com images for ${products.length} products...`);

  for (const product of products) {
    const mapping = PRODUCT_APPLE_ASSETS[product.slug];
    if (!mapping) {
      console.warn(`⚠️ No Apple mapping for ${product.slug}, skipping.`);
      continue;
    }

    const alreadySynced =
      Array.isArray(product.images) &&
      product.images.length > 0 &&
      product.images.some((img) => img.url && img.url.includes(CACHE_BUST));

    if (alreadySynced) {
      console.log(`⏭️  ${product.slug} already synced (${product.images.length} images)`);
      continue;
    }

    // 1. Download & upload hero image
    const heroBuf = await fetchAppleImageBuffer(mapping.hero);
    const heroStoragePath = `products/${product.slug}.jpg`;
    const heroPublicUrl = await uploadBufferToSupabase(heroStoragePath, heroBuf);

    // Save local copy
    fs.writeFileSync(path.join(LOCAL_JPEG_DIR, `${product.slug}.jpg`), heroBuf);

    // 2. Download & upload each color finish image
    const existingColors = safeJsonParse(product.colors, []);
    const updatedColors = [];
    const allProductImageUrls = [heroPublicUrl];

    for (const colorObj of existingColors) {
      const assetId = mapping.colors[colorObj.name] || mapping.hero;
      const colorBuf = await fetchAppleImageBuffer(assetId);
      const colorSlug = slugifyColor(colorObj.name);
      const colorStoragePath = `products/${product.slug}-${colorSlug}.jpg`;
      const colorPublicUrl = await uploadBufferToSupabase(colorStoragePath, colorBuf);

      updatedColors.push({
        ...colorObj,
        images: [colorPublicUrl]
      });

      if (!allProductImageUrls.includes(colorPublicUrl)) {
        allProductImageUrls.push(colorPublicUrl);
      }
    }

    // 3. Update ProductImage rows and Product.colors via Supabase REST API
    const { error: delErr } = await supabaseAdmin
      .from("ProductImage")
      .delete()
      .eq("productId", product.id);
    if (delErr) throw new Error(`Delete images failed for ${product.slug}: ${delErr.message}`);

    const imageRows = allProductImageUrls.map((url, idx) => ({
      id: crypto.randomUUID(),
      productId: product.id,
      url,
      alt: `${product.name} — official Apple photograph ${idx + 1}`,
      isPrimary: idx === 0,
      displayOrder: idx
    }));

    const { error: insErr } = await supabaseAdmin.from("ProductImage").insert(imageRows);
    if (insErr) throw new Error(`Insert images failed for ${product.slug}: ${insErr.message}`);

    const { error: updErr } = await supabaseAdmin
      .from("Product")
      .update({
        colors: JSON.stringify(updatedColors),
        updatedAt: new Date().toISOString()
      })
      .eq("id", product.id);
    if (updErr) throw new Error(`Update colors failed for ${product.slug}: ${updErr.message}`);

    console.log(`✓ ${product.slug} (${updatedColors.length} finishes synced from apple.com)`);
  }

  console.log("\n🎉 All products and color variants updated with official Apple.com photographs!");
}

main().catch((err) => {
  console.error("Error syncing Apple photos:", err);
  process.exitCode = 1;
});
