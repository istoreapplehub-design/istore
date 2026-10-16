/**
 * Attaches a real studio photograph to every product.
 *
 * Uploads the render for each slug to the `product-images` bucket, replaces the
 * product's image rows with it, and points every colour variant at the same
 * file so switching a finish never falls back to a placeholder.
 *
 * Run from backend/: node scripts/attach-product-photos.js
 */
require("dotenv").config();
const fs = require("fs");
const path = require("path");

const prisma = require("../src/utils/prisma");
const { supabaseAdmin } = require("../src/utils/supabase");
const { safeJsonParse } = require("../src/utils/json");

const BUCKET = "product-images";
const MASTER_DIR = path.join(__dirname, "../../vibe_images");
const JPEG_DIR = path.join(MASTER_DIR, "jpeg");

// product slug -> generated render stem in vibe_images/
const SLUG_TO_RENDER = {
  "iphone-15-pro-max-256gb": "iphone-15-pro-max",
  "iphone-15-pro-128gb": "iphone-15-pro",
  "iphone-15-128gb": "iphone-15",
  "iphone-14-128gb": "iphone-14",
  "iphone-13-128gb": "iphone-13",
  "ipad-pro-12-9-m2-256gb": "ipad-pro-12-9",
  "ipad-air-11-m2-128gb": "ipad-air-11",
  "ipad-10th-gen-64gb": "ipad-10th-gen",
  "ipad-mini-6-64gb": "ipad-mini-6",
  "macbook-pro-14-m3-pro": "macbook-pro-14",
  "macbook-air-15-m3-256gb": "macbook-air-15",
  "macbook-air-13-m3-256gb": "macbook-air-13",
  "imac-24-m3": "imac-24",
  "mac-mini-m2": "mac-mini-m2",
  "apple-watch-ultra-2": "watch-ultra-2",
  "apple-watch-series-9-45mm": "watch-series-9",
  "apple-watch-se-2-40mm": "watch-se-2",
  "airpods-pro-2-usb-c": "airpods-pro-2",
  "airpods-3rd-gen": "airpods-3rd-gen",
  "airpods-max": "airpods-max",
  "apple-tv-4k-128gb": "apple-tv-4k",
  "homepod-2nd-gen": "homepod-2nd-gen",
  "homepod-mini": "homepod-mini",
  "apple-pencil-pro": "apple-pencil-pro",
  "magsafe-charger": "magsafe-charger",
  "airtag-4-pack": "airtag-4-pack"
};

function findRender(stem) {
  const file = path.join(JPEG_DIR, `${stem}.jpg`);
  if (!fs.existsSync(file)) {
    throw new Error(`No JPEG derivative at ${file} — re-run the sips conversion from vibe_images/`);
  }
  return file;
}

async function ensurePublicBucket() {
  const { data, error } = await supabaseAdmin.storage.getBucket(BUCKET);
  if (error || !data) {
    throw new Error(`Storage bucket "${BUCKET}" is not reachable: ${error?.message}`);
  }
  if (!data.public) {
    const { error: updateError } = await supabaseAdmin.storage.updateBucket(BUCKET, { public: true });
    if (updateError) {
      throw new Error(`Bucket "${BUCKET}" is private and could not be made public: ${updateError.message}`);
    }
    console.log(`Bucket "${BUCKET}" switched to public.`);
  }
}

async function uploadRender(slug, filePath) {
  const storagePath = `products/${slug}.jpg`;
  const buffer = fs.readFileSync(filePath);

  const { error } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(storagePath, buffer, {
      contentType: "image/jpeg",
      cacheControl: "31536000",
      upsert: true
    });

  if (error) throw new Error(`Upload failed for ${slug}: ${error.message}`);

  // Earlier runs stored full-size PNG masters; drop them so the bucket only
  // holds what the app actually loads.
  await supabaseAdmin.storage.from(BUCKET).remove([`products/${slug}.png`]);

  const { data } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(storagePath);
  return data.publicUrl;
}

async function attach(product, url) {
  await prisma.$transaction([
    prisma.productImage.deleteMany({ where: { productId: product.id } }),
    prisma.productImage.create({
      data: {
        productId: product.id,
        url,
        alt: `${product.name} — studio photograph`,
        isPrimary: true,
        displayOrder: 0
      }
    })
  ]);

  const variants = safeJsonParse(product.colors, []);
  if (Array.isArray(variants) && variants.length) {
    await prisma.product.update({
      where: { id: product.id },
      data: { colors: JSON.stringify(variants.map((v) => ({ ...v, images: [url] }))) }
    });
  }
}

async function main() {
  await ensurePublicBucket();

  const products = await prisma.product.findMany({ orderBy: { slug: "asc" } });
  const missing = products.filter((p) => !SLUG_TO_RENDER[p.slug]);
  if (missing.length) {
    throw new Error(`No render mapped for: ${missing.map((p) => p.slug).join(", ")}`);
  }

  let attached = 0;
  for (const product of products) {
    const url = await uploadRender(product.slug, findRender(SLUG_TO_RENDER[product.slug]));
    await attach(product, url);
    attached += 1;
    console.log(`✓ ${product.slug} → ${url}`);
  }

  console.log(`\n${attached}/${products.length} products now have a real photograph.`);
}

main()
  .catch((err) => {
    console.error(err.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
