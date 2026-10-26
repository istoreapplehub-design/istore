const { z } = require("zod");

const colorSchema = z.object({
  name: z.string().min(1).max(50),
  hex: z.string().regex(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/, "Hex color must be a valid hex code, e.g. #171717"),
  images: z.array(z.string().url()).min(1).max(8)
});

const specsSchema = z.record(z.string(), z.string());

const createProductSchema = z.object({
  name: z.string().min(2).max(150),
  slug: z.string().min(2).max(150).regex(/^[a-z0-9-]+$/, "Slug must only contain lowercase letters, numbers, and hyphens"),
  category: z.enum([
    "iPhone",
    "iPad",
    "Mac",
    "Watch",
    "AirPods",
    "TV & Home",
    "Accessories"
  ]),
  model: z.string().min(1).max(100),
  storage: z.string().max(20).optional().nullable(),
  storages: z.array(z.string()).max(6).optional(),
  priceGHS: z.number().positive("Price must be a positive number"),
  compareAtPriceGHS: z.number().positive("Compare at price must be positive").optional().nullable(),
  stock: z.number().int().min(0).max(10000),
  description: z.string().min(20).max(5000),
  specs: specsSchema.optional(),
  images: z.array(z.string().url()).min(1, "At least 1 product image is required").max(12),
  colors: z.array(colorSchema).max(6).optional(),
  warranty: z.string().min(3).max(200),
  condition: z.enum(["New", "Refurbished"]),
  brand: z.string().default("Apple"),
  tags: z.union([z.string().max(200), z.array(z.string().max(100)).max(8)]).optional(),
  featured: z.boolean().default(false),
  isActive: z.boolean().default(true),
  displayOrder: z.number().int().default(0)
});

const updateProductSchema = createProductSchema.partial();

module.exports = {
  colorSchema,
  specsSchema,
  createProductSchema,
  updateProductSchema
};
