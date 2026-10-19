import React, { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Upload,
  X,
  Plus,
  Trash2,
  Check,
  AlertCircle,
  Package,
  Layers,
  Image as ImageIcon
} from "lucide-react";
import {
  getAdminProductById,
  createAdminProduct,
  updateAdminProduct,
  uploadAdminImage
} from "../lib/api";
import { ProductColor } from "../types";
import { useToast } from "../components/Toast";

const CATEGORIES = [
  "iPhone",
  "iPad",
  "Mac",
  "Watch",
  "AirPods",
  "TV & Home",
  "Accessories"
];

const DEFAULT_SPECS: Record<string, string[]> = {
  iPhone: ["Display", "Chip", "Camera", "Battery", "Water Resistance"],
  iPad: ["Display", "Chip", "Camera", "Battery", "Apple Pencil"],
  Mac: ["Chip", "Memory", "Storage", "Display", "Battery"],
  Watch: ["Case", "Display", "Sensors", "Battery", "Water Resistance"],
  AirPods: ["Audio", "Chip", "Battery", "Charging Case", "Connectivity"],
  "TV & Home": ["Processor", "Resolution", "Audio", "Connectivity", "Ports"],
  Accessories: ["Compatibility", "Material", "Dimensions", "Weight"]
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function ProductForm() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();

  // Basic info
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [category, setCategory] = useState("iPhone");
  const [model, setModel] = useState("");
  const [condition, setCondition] = useState<"New" | "Refurbished">("New");

  // Pricing & Inventory
  const [priceGHS, setPriceGHS] = useState("");
  const [compareAtPriceGHS, setCompareAtPriceGHS] = useState("");
  const [stock, setStock] = useState("10");

  // Description & Specs
  const [description, setDescription] = useState("");
  const [specRows, setSpecRows] = useState<Array<{ key: string; value: string }>>([
    { key: "Display", value: "" },
    { key: "Chip", value: "" }
  ]);

  // Storages (chips)
  const [storages, setStorages] = useState<string[]>(["128GB", "256GB"]);
  const [storageInput, setStorageInput] = useState("");

  // Images & Colors
  const [images, setImages] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [colors, setColors] = useState<ProductColor[]>([
    { name: "Space Black", hex: "#1C1C1E", images: [] }
  ]);

  // Meta
  const [warranty, setWarranty] = useState("1 Year Official Apple Warranty");
  const [tags, setTags] = useState("Apple, Flagship");
  const [featured, setFeatured] = useState(false);
  const [isActive, setIsActive] = useState(true);

  // Errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Query existing product when editing
  const { data: existingProduct, isLoading: loadingProduct } = useQuery({
    queryKey: ["admin-product", id],
    queryFn: () => getAdminProductById(id!),
    enabled: isEdit
  });

  useEffect(() => {
    if (existingProduct) {
      setName(existingProduct.name || "");
      setSlug(existingProduct.slug || "");
      setCategory(existingProduct.category || "iPhone");
      setModel(existingProduct.model || "");
      setCondition(existingProduct.condition || "New");
      setPriceGHS(String(existingProduct.priceGHS || ""));
      setCompareAtPriceGHS(
        existingProduct.compareAtPriceGHS ? String(existingProduct.compareAtPriceGHS) : ""
      );
      setStock(String(existingProduct.stock ?? "10"));
      setDescription(existingProduct.description || "");

      if (existingProduct.specs && Object.keys(existingProduct.specs).length > 0) {
        setSpecRows(
          Object.entries(existingProduct.specs).map(([k, v]) => ({ key: k, value: String(v) }))
        );
      }

      if (existingProduct.storages && existingProduct.storages.length > 0) {
        setStorages(existingProduct.storages);
      } else if (existingProduct.storage) {
        setStorages([existingProduct.storage]);
      }

      setImages(existingProduct.images || []);
      if (existingProduct.colors && existingProduct.colors.length > 0) {
        setColors(existingProduct.colors);
      }
      setWarranty(existingProduct.warranty || "1 Year Official Apple Warranty");
      setTags((existingProduct.tags || []).join(", "));
      setFeatured(existingProduct.featured ?? false);
      setIsActive(existingProduct.isActive ?? true);
    }
  }, [existingProduct]);

  // Category switch prefill
  const handleCategoryChange = (newCat: string) => {
    setCategory(newCat);
    if (specRows.every((r) => !r.value)) {
      const defaultKeys = DEFAULT_SPECS[newCat] || ["Specification"];
      setSpecRows(defaultKeys.map((k) => ({ key: k, value: "" })));
    }
  };

  const handleNameBlur = () => {
    if (!slug.trim() && name.trim()) {
      setSlug(slugify(name));
    }
  };

  // Image Upload handler
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImage(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const res = await uploadAdminImage(file);
        if (res?.url) {
          setImages((prev) => [...prev, res.url]);
        }
      }
      toast.success("Image(s) uploaded successfully.");
    } catch (err: any) {
      toast.error(err.message || "Failed to upload image");
    } finally {
      setUploadingImage(false);
      e.target.value = "";
    }
  };

  // Color Finishes handlers
  const handleAddColor = () => {
    setColors((prev) => [...prev, { name: "New Color", hex: "#000000", images: [] }]);
  };

  const handleUpdateColor = (index: number, field: "name" | "hex", val: string) => {
    setColors((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: val };
      return next;
    });
  };

  const handleRemoveColor = (index: number) => {
    setColors((prev) => prev.filter((_, i) => i !== index));
  };

  const handleColorImageUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await uploadAdminImage(file);
      if (res?.url) {
        setColors((prev) => {
          const next = [...prev];
          next[index] = { ...next[index], images: [res.url] };
          return next;
        });
        toast.success("Color image attached!");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to upload color image");
    } finally {
      e.target.value = "";
    }
  };

  const handleUpdateColorImageUrl = (index: number, url: string) => {
    setColors((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], images: url.trim() ? [url.trim()] : [] };
      return next;
    });
  };

  // Storage Chips handlers
  const handleAddStorageChip = () => {
    const val = storageInput.trim();
    if (val && !storages.includes(val)) {
      setStorages((prev) => [...prev, val]);
      setStorageInput("");
    }
  };

  // Validation
  const validate = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = "Product title is required.";
    if (!slug.trim()) errs.slug = "Slug is required.";
    if (!model.trim()) errs.model = "Model identifier is required.";

    const price = parseFloat(priceGHS);
    if (isNaN(price) || price <= 0) errs.priceGHS = "Valid price in GHS is required.";

    const stockNum = parseInt(stock, 10);
    if (isNaN(stockNum) || stockNum < 0) errs.stock = "Stock must be 0 or greater.";

    if (description.trim().length < 20) {
      errs.description = "Description must be at least 20 characters.";
    }

    if (images.length === 0) {
      errs.images = "At least one product image is required.";
    }

    if (!warranty.trim()) {
      errs.warranty = "Warranty coverage is required.";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Submit mutations
  const mutation = useMutation({
    mutationFn: (payload: any) =>
      isEdit ? updateAdminProduct(id!, payload) : createAdminProduct(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["product-stats"] });
      toast.success(isEdit ? "Product updated successfully!" : "Product created successfully!");
      navigate("/products");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to save product.");
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      toast.error("Please resolve highlighted form errors.");
      return;
    }

    // Specs dict
    const specsDict: Record<string, string> = {};
    specRows.forEach((r) => {
      if (r.key.trim() && r.value.trim()) {
        specsDict[r.key.trim()] = r.value.trim();
      }
    });

    const tagsArr = tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const payload = {
      name: name.trim(),
      slug: slug.trim(),
      category,
      model: model.trim(),
      condition,
      priceGHS: parseFloat(priceGHS),
      compareAtPriceGHS: compareAtPriceGHS ? parseFloat(compareAtPriceGHS) : null,
      stock: parseInt(stock, 10),
      description: description.trim(),
      specs: specsDict,
      storage: storages.length > 0 ? storages[0] : undefined,
      storages: storages.length > 0 ? storages : undefined,
      images,
      colors: colors.map((c, i) => (i === 0 && c.images.length === 0 ? { ...c, images } : c)),
      warranty: warranty.trim(),
      tags: tagsArr,
      featured,
      isActive
    };

    mutation.mutate(payload);
  };

  if (loadingProduct) {
    return (
      <div className="py-20 text-center text-sm text-gray-500">
        Loading product information...
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 animate-fade-in pb-16">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/products"
            className="p-2 text-gray-400 hover:text-gray-700 bg-white border border-gray-200 rounded-full transition shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              {isEdit ? "Edit Product" : "New Product"}
            </h1>
            <p className="text-xs text-gray-500">
              {isEdit ? `Updating ${existingProduct?.name}` : "Publish a new Apple device or accessory"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/products")}
            className="px-5 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-full hover:bg-gray-50 transition shadow-sm"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="px-6 py-2 text-sm font-semibold text-white bg-black hover:bg-neutral-800 rounded-full shadow-xs transition disabled:opacity-50"
          >
            {mutation.isPending ? "Saving..." : isEdit ? "Save Changes" : "Publish Product"}
          </button>
        </div>
      </div>

      {/* Two-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column (2/3): Core Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card 1: Basic Info */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
            <h2 className="text-base font-semibold text-gray-900">Basic Information</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Product Title *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onBlur={handleNameBlur}
                  placeholder="e.g. iPhone 16 Pro Max 256GB"
                  className={`w-full rounded-xl border px-3.5 py-2 text-sm outline-none transition ${
                    errors.name ? "border-rose-400" : "border-gray-200 focus:border-black"
                  }`}
                />
                {errors.name && <p className="text-xs text-rose-600 mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  URL Slug *
                </label>
                <input
                  type="text"
                  required
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="e.g. iphone-16-pro-max-256gb"
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-2 text-sm font-mono outline-none focus:border-black transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Category *
                </label>
                <select
                  value={category}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-2 text-sm font-medium text-gray-700 outline-none focus:border-black transition"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Model Code *
                </label>
                <input
                  type="text"
                  required
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="e.g. A3296"
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-2 text-sm outline-none focus:border-black transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Condition
                </label>
                <div className="flex gap-2">
                  {(["New", "Refurbished"] as const).map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCondition(c)}
                      className={`flex-1 py-2 text-xs font-semibold rounded-xl border transition ${
                        condition === c
                          ? "bg-neutral-900 border-neutral-900 text-white"
                          : "border-gray-200 text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Pricing & Inventory */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
            <h2 className="text-base font-semibold text-gray-900">Pricing & Stock</h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Selling Price (GHS) *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">
                    ₵
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={priceGHS}
                    onChange={(e) => setPriceGHS(e.target.value)}
                    placeholder="0.00"
                    className="w-full rounded-xl border border-gray-200 pl-8 pr-3.5 py-2 text-sm font-semibold outline-none focus:border-black transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Compare At Price (Optional)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">
                    ₵
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    value={compareAtPriceGHS}
                    onChange={(e) => setCompareAtPriceGHS(e.target.value)}
                    placeholder="MSRP"
                    className="w-full rounded-xl border border-gray-200 pl-8 pr-3.5 py-2 text-sm outline-none focus:border-black transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Stock Units *
                </label>
                <input
                  type="number"
                  required
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  placeholder="10"
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-2 text-sm outline-none focus:border-black transition"
                />
              </div>
            </div>
          </div>

          {/* Card 3: Storage Options */}
          {["iPhone", "iPad", "Mac", "Watch"].includes(category) && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
              <h2 className="text-base font-semibold text-gray-900">Storage Variants</h2>

              <div className="flex flex-wrap gap-2">
                {storages.map((s) => (
                  <span
                    key={s}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 text-gray-800 rounded-lg text-xs font-semibold"
                  >
                    {s}
                    <button
                      type="button"
                      onClick={() => setStorages(storages.filter((x) => x !== s))}
                      className="text-gray-400 hover:text-gray-700"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>

              <div className="flex gap-2 max-w-xs">
                <input
                  type="text"
                  placeholder="e.g. 512GB"
                  value={storageInput}
                  onChange={(e) => setStorageInput(e.target.value)}
                  className="flex-1 rounded-xl border border-gray-200 px-3 py-1.5 text-xs outline-none focus:border-black"
                />
                <button
                  type="button"
                  onClick={handleAddStorageChip}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-xl transition"
                >
                  Add
                </button>
              </div>
            </div>
          )}

          {/* Card 4: Description */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
            <h2 className="text-base font-semibold text-gray-900">Description</h2>
            <textarea
              rows={5}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed marketing description, hardware specs, box contents..."
              className="w-full rounded-xl border border-gray-200 p-3.5 text-sm outline-none focus:border-black transition"
            />
            {errors.description && (
              <p className="text-xs text-rose-600">{errors.description}</p>
            )}
          </div>

          {/* Card 5: Specifications Table */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-gray-900">Key Specifications</h2>
                <p className="text-xs text-gray-500">Hardware capability key-value table</p>
              </div>
              <button
                type="button"
                onClick={() => setSpecRows([...specRows, { key: "", value: "" }])}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-black hover:underline"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Row</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {specRows.map((row, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Feature (e.g. Chip)"
                    value={row.key}
                    onChange={(e) => {
                      const next = [...specRows];
                      next[idx].key = e.target.value;
                      setSpecRows(next);
                    }}
                    className="w-1/3 rounded-xl border border-gray-200 px-3 py-1.5 text-xs font-medium outline-none focus:border-black"
                  />
                  <input
                    type="text"
                    placeholder="Value (e.g. A18 Pro 3nm)"
                    value={row.value}
                    onChange={(e) => {
                      const next = [...specRows];
                      next[idx].value = e.target.value;
                      setSpecRows(next);
                    }}
                    className="flex-1 rounded-xl border border-gray-200 px-3 py-1.5 text-xs outline-none focus:border-black"
                  />
                  <button
                    type="button"
                    onClick={() => setSpecRows(specRows.filter((_, i) => i !== idx))}
                    className="p-1.5 text-gray-400 hover:text-rose-600 transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (1/3, sticky): Media & Settings */}
        <div className="space-y-6 sticky top-6">
          {/* Card: Images */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
            <h2 className="text-base font-semibold text-gray-900">Product Images</h2>

            {/* Thumbnails Grid */}
            <div className="grid grid-cols-3 gap-2.5">
              {images.map((imgUrl, idx) => (
                <div
                  key={idx}
                  className="relative aspect-square rounded-xl bg-gray-100 border border-gray-200 overflow-hidden group"
                >
                  <img src={imgUrl} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setImages(images.filter((_, i) => i !== idx))}
                    className="absolute top-1 right-1 p-1 bg-black/60 hover:bg-black text-white rounded-full transition opacity-0 group-hover:opacity-100"
                  >
                    <X className="w-3 h-3" />
                  </button>
                  {idx === 0 && (
                    <span className="absolute bottom-1 left-1 text-[9px] font-bold bg-black text-white px-1.5 py-0.5 rounded">
                      HERO
                    </span>
                  )}
                </div>
              ))}

              {/* Upload Tile */}
              {images.length < 6 && (
                <label className="aspect-square rounded-xl border-2 border-dashed border-gray-200 hover:border-black flex flex-col items-center justify-center cursor-pointer transition p-2 text-center bg-gray-50/50">
                  <Upload className="w-5 h-5 text-gray-400 mb-1" />
                  <span className="text-[11px] font-semibold text-black">
                    {uploadingImage ? "Uploading..." : "Add Image"}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    disabled={uploadingImage}
                    onChange={handleImageFileChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {errors.images && <p className="text-xs text-rose-600">{errors.images}</p>}
          </div>

          {/* Card: Colors */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-gray-900">Color Finishes</h2>
                <p className="text-xs text-gray-400">Assign specific images to each finish</p>
              </div>
              <button
                type="button"
                onClick={handleAddColor}
                className="text-xs font-semibold text-black hover:underline"
              >
                + Add Color
              </button>
            </div>

            <div className="space-y-3">
              {colors.map((c, idx) => {
                const colorImg = Array.isArray(c.images) && c.images.length > 0 ? c.images[0] : "";
                return (
                  <div
                    key={idx}
                    className="p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-2.5"
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={c.hex}
                        onChange={(e) => handleUpdateColor(idx, "hex", e.target.value)}
                        className="w-7 h-7 rounded-lg border-0 cursor-pointer p-0 bg-transparent"
                      />
                      <input
                        type="text"
                        value={c.name}
                        onChange={(e) => handleUpdateColor(idx, "name", e.target.value)}
                        placeholder="Color title"
                        className="flex-1 text-xs bg-transparent border-0 outline-none font-semibold text-gray-900"
                      />
                      <span className="text-[11px] font-mono text-gray-400">{c.hex}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveColor(idx)}
                        className="p-1 text-gray-400 hover:text-rose-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Per-Color Finish Image */}
                    <div className="flex items-center gap-2 pt-2 border-t border-gray-200/60">
                      {colorImg ? (
                        <div className="relative w-10 h-10 rounded-lg bg-white border border-gray-200 overflow-hidden flex-shrink-0">
                          <img src={colorImg} alt={c.name} className="w-full h-full object-contain p-0.5" />
                          <button
                            type="button"
                            onClick={() => handleUpdateColorImageUrl(idx, "")}
                            className="absolute inset-0 bg-black/50 text-white opacity-0 hover:opacity-100 flex items-center justify-center transition"
                            title="Remove image"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-gray-200/60 border border-dashed border-gray-300 flex items-center justify-center flex-shrink-0 text-gray-400">
                          <ImageIcon className="w-4 h-4" />
                        </div>
                      )}

                      <input
                        type="url"
                        value={colorImg}
                        onChange={(e) => handleUpdateColorImageUrl(idx, e.target.value)}
                        placeholder="Image URL or upload..."
                        className="flex-1 text-[11px] bg-white rounded-lg border border-gray-200 px-2 py-1.5 outline-none focus:border-black font-mono text-gray-600"
                      />

                      <label className="px-2.5 py-1.5 bg-black hover:bg-gray-800 text-white text-[11px] font-medium rounded-lg cursor-pointer transition flex items-center gap-1">
                        <Upload className="w-3 h-3" />
                        <span>Upload</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleColorImageUpload(idx, e)}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Card: Metadata & Switches */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
            <h2 className="text-base font-semibold text-gray-900">Metadata & Flags</h2>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Warranty Statement *
              </label>
              <input
                type="text"
                required
                value={warranty}
                onChange={(e) => setWarranty(e.target.value)}
                placeholder="1 Year Official Warranty"
                className="w-full rounded-xl border border-gray-200 px-3.5 py-2 text-xs outline-none focus:border-black"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Tags</label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="Apple, M4, Pro"
                className="w-full rounded-xl border border-gray-200 px-3.5 py-2 text-xs outline-none focus:border-black"
              />
            </div>

            <div className="pt-2 border-t border-gray-100 space-y-3">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <span className="text-xs font-bold text-gray-900">Featured in Hero</span>
                  <p className="text-[11px] text-gray-400">Showcase in mobile & web banners</p>
                </div>
                <input
                  type="checkbox"
                  checked={featured}
                  onChange={(e) => setFeatured(e.target.checked)}
                  className="w-4 h-4 text-black accent-black rounded focus:ring-black"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <span className="text-xs font-bold text-gray-900">Active in Store</span>
                  <p className="text-[11px] text-gray-400">Visible to customer storefront</p>
                </div>
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 text-black accent-black rounded focus:ring-black"
                />
              </label>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}

export default ProductForm;
