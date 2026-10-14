import { useCallback, useEffect, useMemo, useState } from "react";
import { getProducts } from "../services/api";
import { Product } from "../types";

/** Ghana is on GMT year-round, so the daily window closes at UTC midnight. */
export function nextFlashWindowEnd(now: number = Date.now()): number {
  const date = new Date(now);
  date.setUTCHours(24, 0, 0, 0);
  return date.getTime();
}

export function discountPercent(product: Product): number {
  const was = product.compareAtPriceGHS;
  if (!was || was <= product.priceGHS) return 0;
  return Math.round(((was - product.priceGHS) / was) * 100);
}

export function amountSaved(product: Product): number {
  const was = product.compareAtPriceGHS || 0;
  return was > product.priceGHS ? was - product.priceGHS : 0;
}

/** Products that genuinely carry a live compare-at price and still have stock. */
export function selectFlashDeals(products: Product[]): Product[] {
  return products
    .filter((p) => discountPercent(p) > 0 && p.stock > 0)
    .sort((a, b) => discountPercent(b) - discountPercent(a));
}

export interface FlashDealsState {
  /** Every product in the loaded page, useful for thumbnails and cross-sell. */
  products: Product[];
  deals: Product[];
  endsAt: number;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useFlashDeals(): FlashDealsState {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [endsAt, setEndsAt] = useState(() => nextFlashWindowEnd());

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getProducts({ limit: 60 });
      setProducts(res.data || []);
      setEndsAt(nextFlashWindowEnd());
    } catch (err: unknown) {
      setError(err instanceof Error ? err : new Error("Failed to load flash deals"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const deals = useMemo(() => selectFlashDeals(products), [products]);
  return { products, deals, endsAt, loading, error, refetch };
}
