import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { colors, theme } from "../../constants/theme";
import { CategoryPicker } from "./CategoryPicker";
import { ColorVariant, ColorVariantEditor } from "./ColorVariantEditor";
import { ImageUploader } from "./ImageUploader";

export interface ProductFormData {
  name: string;
  slug: string;
  category: string;
  model: string;
  storage?: string;
  storages?: string[];
  priceGHS: number;
  compareAtPriceGHS?: number | null;
  stock: number;
  description: string;
  specs: Record<string, string>;
  images: string[];
  colors: ColorVariant[];
  warranty: string;
  condition: "New" | "Refurbished";
  brand: string;
  tags: string;
  featured: boolean;
  isActive: boolean;
  displayOrder: number;
}

export interface ProductFormProps {
  initialData?: Partial<ProductFormData>;
  mode: "create" | "edit";
  onSubmit: (data: ProductFormData) => Promise<void>;
  submitting: boolean;
}

const DEFAULT_SPECS_BY_CATEGORY: Record<string, string[]> = {
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

export function ProductForm({
  initialData,
  mode,
  onSubmit,
  submitting
}: ProductFormProps) {
  const scrollRef = useRef<ScrollView>(null);

  // Form Fields
  const [name, setName] = useState(initialData?.name || "");
  const [slug, setSlug] = useState(initialData?.slug || "");
  const [category, setCategory] = useState(initialData?.category || "iPhone");
  const [model, setModel] = useState(initialData?.model || "");
  const [condition, setCondition] = useState<"New" | "Refurbished">(
    initialData?.condition === "Refurbished" ? "Refurbished" : "New"
  );

  const [storages, setStorages] = useState<string[]>(
    initialData?.storages || (initialData?.storage ? [initialData.storage] : ["128GB", "256GB"])
  );
  const [storageInput, setStorageInput] = useState("");

  const [priceGHS, setPriceGHS] = useState(
    initialData?.priceGHS !== undefined ? String(initialData.priceGHS) : ""
  );
  const [compareAtPriceGHS, setCompareAtPriceGHS] = useState(
    initialData?.compareAtPriceGHS !== undefined && initialData?.compareAtPriceGHS !== null
      ? String(initialData.compareAtPriceGHS)
      : ""
  );
  const [stock, setStock] = useState(
    initialData?.stock !== undefined ? String(initialData.stock) : "10"
  );

  const [images, setImages] = useState<string[]>(initialData?.images || []);
  const [colorsState, setColorsState] = useState<ColorVariant[]>(
    initialData?.colors && initialData.colors.length > 0
      ? initialData.colors
      : [{ name: "Midnight", hex: "#1D232C", images: [] }]
  );

  const [description, setDescription] = useState(initialData?.description || "");

  // Specs key-value array for inline editing
  const [specRows, setSpecRows] = useState<Array<{ key: string; value: string }>>(() => {
    if (initialData?.specs && Object.keys(initialData.specs).length > 0) {
      return Object.entries(initialData.specs).map(([k, v]) => ({ key: k, value: String(v) }));
    }
    const defaultKeys = DEFAULT_SPECS_BY_CATEGORY[initialData?.category || "iPhone"] || [
      "Display",
      "Chip"
    ];
    return defaultKeys.map((k) => ({ key: k, value: "" }));
  });

  const [warranty, setWarranty] = useState(initialData?.warranty || "1 Year Apple Official Warranty");
  const [brand] = useState(initialData?.brand || "Apple");
  const [tagsInput, setTagsInput] = useState<string>(() => {
    const t: unknown = initialData?.tags;
    if (Array.isArray(t)) return t.join(", ");
    return typeof t === "string" && t ? t : "Apple, Premium";
  });
  const [featured, setFeatured] = useState(initialData?.featured ?? false);
  const [isActive, setIsActive] = useState(initialData?.isActive ?? true);
  const [displayOrder] = useState(initialData?.displayOrder ?? 0);

  // Inline Validation Errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Auto-slug on name blur
  const handleNameBlur = () => {
    if (!slug.trim() && name.trim()) {
      setSlug(slugify(name));
    }
  };

  const handleCategoryChange = (newCat: string) => {
    setCategory(newCat);
    // If no specs exist yet, prefill
    if (specRows.length === 0 || specRows.every((r) => !r.value)) {
      const keys = DEFAULT_SPECS_BY_CATEGORY[newCat] || ["Specification"];
      setSpecRows(keys.map((k) => ({ key: k, value: "" })));
    }
  };

  const handleAddStorage = () => {
    const val = storageInput.trim();
    if (val && !storages.includes(val)) {
      Haptics.selectionAsync();
      setStorages([...storages, val]);
      setStorageInput("");
    }
  };

  const handleRemoveStorage = (item: string) => {
    Haptics.selectionAsync();
    setStorages(storages.filter((s) => s !== item));
  };

  const handleAddSpecRow = () => {
    Haptics.selectionAsync();
    setSpecRows([...specRows, { key: "", value: "" }]);
  };

  const handleRemoveSpecRow = (idx: number) => {
    Haptics.selectionAsync();
    setSpecRows(specRows.filter((_, i) => i !== idx));
  };

  const handleUpdateSpecRow = (idx: number, field: "key" | "value", val: string) => {
    const next = [...specRows];
    next[idx] = { ...next[idx], [field]: val };
    setSpecRows(next);
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!name.trim()) errs.name = "Product name is required";
    if (!slug.trim()) errs.slug = "Slug is required";
    if (!model.trim()) errs.model = "Model is required";

    const parsedPrice = parseFloat(priceGHS);
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      errs.priceGHS = "Enter a valid price in GHS";
    }

    const parsedStock = parseInt(stock, 10);
    if (isNaN(parsedStock) || parsedStock < 0) {
      errs.stock = "Enter stock quantity (>= 0)";
    }

    if (description.trim().length < 20) {
      errs.description = "Description must be at least 20 characters";
    }

    if (images.length === 0) {
      errs.images = "At least one product image is required";
    }

    if (!warranty.trim()) {
      errs.warranty = "Warranty is required";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    const isValid = validate();
    if (!isValid) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      return;
    }

    // Prepare specs dict
    const specsObj: Record<string, string> = {};
    specRows.forEach((row) => {
      if (row.key.trim() && row.value.trim()) {
        specsObj[row.key.trim()] = row.value.trim();
      }
    });

    // Prepare tags as the comma-separated string the backend stores
    const tagsValue = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)
      .join(",");

    // Every color variant needs a 6-digit hex and at least one image URL
    const preparedColors = colorsState.map((c) => {
      const hex = (c.hex || "").trim();
      const normalizedHex = /^#[0-9A-Fa-f]{3}$/.test(hex)
        ? `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`
        : hex;
      return {
        ...c,
        hex: normalizedHex,
        images: c.images && c.images.length > 0 ? c.images : images.slice(0, 1)
      };
    });

    const payload: ProductFormData = {
      name: name.trim(),
      slug: slug.trim(),
      category,
      model: model.trim(),
      storage: storages.length > 0 ? storages[0] : undefined,
      storages: storages.length > 0 ? storages : undefined,
      priceGHS: parseFloat(priceGHS),
      compareAtPriceGHS: compareAtPriceGHS ? parseFloat(compareAtPriceGHS) : null,
      stock: parseInt(stock, 10),
      description: description.trim(),
      specs: specsObj,
      images,
      colors: preparedColors,
      warranty: warranty.trim(),
      condition,
      brand,
      tags: tagsValue,
      featured,
      isActive,
      displayOrder
    };

    Haptics.selectionAsync();
    await onSubmit(payload);
  };

  const showStorageSection = ["iPhone", "iPad", "Mac", "Watch"].includes(category);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.keyboardContainer}
    >
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* SECTION 1 — Basic Info */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>Basic Information</Text>

          <Text style={styles.fieldLabel}>Product Name *</Text>
          <TextInput
            style={[styles.input, errors.name && styles.inputError]}
            placeholder="e.g. iPhone 16 Pro Max"
            placeholderTextColor={colors.textTertiary}
            value={name}
            onChangeText={(txt) => {
              setName(txt);
              if (errors.name) setErrors((prev) => ({ ...prev, name: "" }));
            }}
            onBlur={handleNameBlur}
          />
          {errors.name ? <Text style={styles.errorText}>{errors.name}</Text> : null}

          <Text style={styles.fieldLabel}>URL Slug *</Text>
          <TextInput
            style={[styles.input, errors.slug && styles.inputError]}
            placeholder="e.g. iphone-16-pro-max"
            placeholderTextColor={colors.textTertiary}
            value={slug}
            autoCapitalize="none"
            onChangeText={(txt) => {
              setSlug(txt);
              if (errors.slug) setErrors((prev) => ({ ...prev, slug: "" }));
            }}
          />
          {errors.slug ? <Text style={styles.errorText}>{errors.slug}</Text> : null}

          <Text style={styles.fieldLabel}>Category *</Text>
          <CategoryPicker value={category} onChange={handleCategoryChange} />

          <Text style={styles.fieldLabel}>Model *</Text>
          <TextInput
            style={[styles.input, errors.model && styles.inputError]}
            placeholder="e.g. A3296"
            placeholderTextColor={colors.textTertiary}
            value={model}
            onChangeText={(txt) => {
              setModel(txt);
              if (errors.model) setErrors((prev) => ({ ...prev, model: "" }));
            }}
          />
          {errors.model ? <Text style={styles.errorText}>{errors.model}</Text> : null}

          <Text style={styles.fieldLabel}>Condition</Text>
          <View style={styles.segmentContainer}>
            <Pressable
              onPress={() => {
                Haptics.selectionAsync();
                setCondition("New");
              }}
              style={[
                styles.segmentItem,
                condition === "New" && styles.segmentItemSelected
              ]}
            >
              <Text
                style={[
                  styles.segmentText,
                  condition === "New" && styles.segmentTextSelected
                ]}
              >
                Brand New
              </Text>
            </Pressable>
            <Pressable
              onPress={() => {
                Haptics.selectionAsync();
                setCondition("Refurbished");
              }}
              style={[
                styles.segmentItem,
                condition === "Refurbished" && styles.segmentItemSelected
              ]}
            >
              <Text
                style={[
                  styles.segmentText,
                  condition === "Refurbished" && styles.segmentTextSelected
                ]}
              >
                Refurbished
              </Text>
            </Pressable>
          </View>
        </View>

        {/* SECTION 2 — Storage & Variants */}
        {showStorageSection && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionHeader}>Storage Options</Text>
            <View style={styles.chipRow}>
              {storages.map((item) => (
                <View key={item} style={styles.chip}>
                  <Text style={styles.chipText}>{item}</Text>
                  <Pressable
                    hitSlop={6}
                    onPress={() => handleRemoveStorage(item)}
                    style={{ marginLeft: 6 }}
                  >
                    <Ionicons name="close-circle" size={16} color={colors.textSecondary} />
                  </Pressable>
                </View>
              ))}
            </View>

            <View style={styles.addStorageRow}>
              <TextInput
                style={[styles.input, { flex: 1, marginBottom: 0 }]}
                placeholder="e.g. 1TB"
                placeholderTextColor={colors.textTertiary}
                value={storageInput}
                onChangeText={setStorageInput}
              />
              <Pressable
                style={({ pressed }) => [
                  styles.addSmallBtn,
                  pressed && { opacity: 0.7 }
                ]}
                onPress={handleAddStorage}
              >
                <Text style={styles.addSmallBtnText}>Add</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* SECTION 3 — Pricing */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>Pricing & Inventory</Text>

          <Text style={styles.fieldLabel}>Price (GHS) *</Text>
          <View style={styles.currencyInputWrapper}>
            <Text style={styles.currencyPrefix}>₵</Text>
            <TextInput
              style={[styles.currencyInput, errors.priceGHS && styles.inputError]}
              placeholder="0.00"
              placeholderTextColor={colors.textTertiary}
              keyboardType="numeric"
              value={priceGHS}
              onChangeText={(txt) => {
                setPriceGHS(txt);
                if (errors.priceGHS) setErrors((prev) => ({ ...prev, priceGHS: "" }));
              }}
            />
          </View>
          {errors.priceGHS ? <Text style={styles.errorText}>{errors.priceGHS}</Text> : null}

          <Text style={styles.fieldLabel}>Compare-at Price (Optional)</Text>
          <View style={styles.currencyInputWrapper}>
            <Text style={styles.currencyPrefix}>₵</Text>
            <TextInput
              style={styles.currencyInput}
              placeholder="e.g. Original MSRP"
              placeholderTextColor={colors.textTertiary}
              keyboardType="numeric"
              value={compareAtPriceGHS}
              onChangeText={setCompareAtPriceGHS}
            />
          </View>

          <Text style={styles.fieldLabel}>Stock Quantity *</Text>
          <TextInput
            style={[styles.input, errors.stock && styles.inputError]}
            placeholder="Available units"
            placeholderTextColor={colors.textTertiary}
            keyboardType="number-pad"
            value={stock}
            onChangeText={(txt) => {
              setStock(txt);
              if (errors.stock) setErrors((prev) => ({ ...prev, stock: "" }));
            }}
          />
          {errors.stock ? <Text style={styles.errorText}>{errors.stock}</Text> : null}
        </View>

        {/* SECTION 4 — Images */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>Product Images *</Text>
          <Text style={styles.sectionSub}>The first photo will be used as the primary hero image.</Text>
          <ImageUploader
            images={images}
            onImagesChange={(urls) => {
              setImages(urls);
              if (errors.images) setErrors((prev) => ({ ...prev, images: "" }));
            }}
            maxImages={6}
          />
          {errors.images ? <Text style={styles.errorText}>{errors.images}</Text> : null}
        </View>

        {/* SECTION 5 — Colors */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>Color Finishes</Text>
          <ColorVariantEditor colors={colorsState} onChange={setColorsState} />
        </View>

        {/* SECTION 6 — Description & Specs */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>Description & Specifications</Text>

          <Text style={styles.fieldLabel}>Description (Min 20 characters) *</Text>
          <TextInput
            style={[
              styles.input,
              styles.textArea,
              errors.description && styles.inputError
            ]}
            placeholder="Provide a detailed description of features, materials, and capabilities..."
            placeholderTextColor={colors.textTertiary}
            multiline
            numberOfLines={4}
            value={description}
            onChangeText={(txt) => {
              setDescription(txt);
              if (errors.description) setErrors((prev) => ({ ...prev, description: "" }));
            }}
          />
          {errors.description ? (
            <Text style={styles.errorText}>{errors.description}</Text>
          ) : null}

          <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Key Specs (Key - Value Pairs)</Text>
          <View style={{ gap: 8, marginTop: 4 }}>
            {specRows.map((row, idx) => (
              <View key={idx} style={styles.specRow}>
                <TextInput
                  style={[styles.input, styles.specKeyInput]}
                  placeholder="Feature"
                  placeholderTextColor={colors.textTertiary}
                  value={row.key}
                  onChangeText={(val) => handleUpdateSpecRow(idx, "key", val)}
                />
                <TextInput
                  style={[styles.input, styles.specValInput]}
                  placeholder="Value / Spec"
                  placeholderTextColor={colors.textTertiary}
                  value={row.value}
                  onChangeText={(val) => handleUpdateSpecRow(idx, "value", val)}
                />
                <Pressable
                  hitSlop={8}
                  onPress={() => handleRemoveSpecRow(idx)}
                  style={styles.specRemoveBtn}
                >
                  <Ionicons name="close" size={18} color={colors.textSecondary} />
                </Pressable>
              </View>
            ))}

            <Pressable
              style={({ pressed }) => [
                styles.addSpecBtn,
                pressed && { opacity: 0.7 }
              ]}
              onPress={handleAddSpecRow}
            >
              <Ionicons name="add" size={16} color={colors.accent} />
              <Text style={styles.addSpecText}>Add Specification</Text>
            </Pressable>
          </View>
        </View>

        {/* SECTION 7 — Meta */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>Warranty & Metadata</Text>

          <Text style={styles.fieldLabel}>Warranty Coverage *</Text>
          <TextInput
            style={[styles.input, errors.warranty && styles.inputError]}
            placeholder="e.g. 1 Year Official Apple Warranty"
            placeholderTextColor={colors.textTertiary}
            value={warranty}
            onChangeText={(txt) => {
              setWarranty(txt);
              if (errors.warranty) setErrors((prev) => ({ ...prev, warranty: "" }));
            }}
          />
          {errors.warranty ? <Text style={styles.errorText}>{errors.warranty}</Text> : null}

          <Text style={styles.fieldLabel}>Tags (comma-separated)</Text>
          <TextInput
            style={styles.input}
            placeholder="Apple, Flagship, Titanium"
            placeholderTextColor={colors.textTertiary}
            value={tagsInput}
            onChangeText={setTagsInput}
          />

          <View style={styles.switchRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.switchTitle}>Featured Product</Text>
              <Text style={styles.switchSub}>Show on home screen showcase carousel</Text>
            </View>
            <Switch
              value={featured}
              onValueChange={setFeatured}
              trackColor={{ false: colors.border, true: colors.accent }}
            />
          </View>

          {mode === "edit" && (
            <View style={[styles.switchRow, { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.switchTitle}>Active in Store</Text>
                <Text style={styles.switchSub}>When disabled, product is hidden from customer browsing</Text>
              </View>
              <Switch
                value={isActive}
                onValueChange={setIsActive}
                trackColor={{ false: colors.border, true: colors.accent }}
              />
            </View>
          )}
        </View>

        {/* SECTION 8 — Submit Button */}
        <View style={styles.submitContainer}>
          <Pressable
            disabled={submitting}
            onPress={handleSubmit}
            style={({ pressed }) => [
              styles.submitBtn,
              submitting && styles.submitBtnDisabled,
              pressed && { opacity: 0.8 }
            ]}
          >
            {submitting ? (
              <View style={styles.submittingContent}>
                <ActivityIndicator size="small" color="#FFFFFF" />
                <Text style={styles.submitBtnText}>Saving...</Text>
              </View>
            ) : (
              <Text style={styles.submitBtnText}>
                {mode === "create" ? "Create Product" : "Save Changes"}
              </Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: theme.colors.background
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 60
  },
  sectionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16
  },
  sectionHeader: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 4
  },
  sectionSub: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 12
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
    marginTop: 12,
    marginBottom: 6
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border
  },
  inputError: {
    borderColor: colors.danger
  },
  errorText: {
    fontSize: 12,
    color: colors.danger,
    marginTop: 4,
    fontWeight: "500"
  },
  textArea: {
    minHeight: 90,
    textAlignVertical: "top"
  },
  segmentContainer: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 4,
    marginTop: 4
  },
  segmentItem: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 8
  },
  segmentItemSelected: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2
  },
  segmentText: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.textSecondary
  },
  segmentTextSelected: {
    fontWeight: "700",
    color: colors.text
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginVertical: 8
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border
  },
  chipText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.text
  },
  addStorageRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    marginTop: 8
  },
  addSmallBtn: {
    backgroundColor: colors.accent,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12
  },
  addSmallBtnText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 14
  },
  currencyInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14
  },
  currencyPrefix: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.accent,
    marginRight: 6
  },
  currencyInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text
  },
  specRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  specKeyInput: {
    flex: 1.2
  },
  specValInput: {
    flex: 2
  },
  specRemoveBtn: {
    padding: 6
  },
  addSpecBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    gap: 6
  },
  addSpecText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.accent
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    marginTop: 8
  },
  switchTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text
  },
  switchSub: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2
  },
  submitContainer: {
    marginTop: 8,
    marginBottom: 20
  },
  submitBtn: {
    backgroundColor: colors.accent,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center"
  },
  submitBtnDisabled: {
    opacity: 0.6
  },
  submittingContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  submitBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700"
  }
});

export default ProductForm;
