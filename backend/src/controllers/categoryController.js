const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const CATEGORIES_METADATA = [
  {
    name: "iPhone",
    slug: "iphone",
    image: "https://placehold.co/800x800/1D1D1F/FFFFFF?text=iPhone",
    displayOrder: 1
  },
  {
    name: "iPad",
    slug: "ipad",
    image: "https://placehold.co/800x800/5B8FB9/FFFFFF?text=iPad",
    displayOrder: 2
  },
  {
    name: "Mac",
    slug: "mac",
    image: "https://placehold.co/800x800/1C242F/FFFFFF?text=Mac",
    displayOrder: 3
  },
  {
    name: "Watch",
    slug: "watch",
    image: "https://placehold.co/800x800/C5C5C7/1D1D1F?text=Apple+Watch",
    displayOrder: 4
  },
  {
    name: "AirPods",
    slug: "airpods",
    image: "https://placehold.co/800x800/F5F5F7/1D1D1F?text=AirPods",
    displayOrder: 5
  },
  {
    name: "TV & Home",
    slug: "tv-and-home",
    image: "https://placehold.co/800x800/22252A/FFFFFF?text=TV+%26+Home",
    displayOrder: 6
  },
  {
    name: "Accessories",
    slug: "accessories",
    image: "https://placehold.co/800x800/EEEEEE/1D1D1F?text=Accessories",
    displayOrder: 7
  }
];

/**
 * Lists the 7 official store categories with active product counts in standard display order
 */
async function listCategories(req, res, next) {
  try {
    const counts = await prisma.product.groupBy({
      by: ["category"],
      where: {
        isActive: true
      },
      _count: {
        _all: true
      }
    });

    const countMap = {};
    counts.forEach((item) => {
      countMap[item.category] = item._count._all;
    });

    const categories = CATEGORIES_METADATA.map((cat) => ({
      name: cat.name,
      slug: cat.slug,
      count: countMap[cat.name] || 0,
      image: cat.image,
      displayOrder: cat.displayOrder
    }));

    res.json(categories);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listCategories
};
