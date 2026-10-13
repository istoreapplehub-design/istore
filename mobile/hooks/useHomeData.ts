import { useCallback, useEffect, useState } from "react";
import { getCategories, getProducts } from "../services/api";
import { Category, Product } from "../types";

export interface HomeDataState {
  featured: Product[];
  newArrivals: Product[];
  bestSellers: Product[];
  categories: Category[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useHomeData(): HomeDataState {
  const [featured, setFeatured] = useState<Product[]>([]);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [bestSellers, setBestSellers] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [featuredRes, newArrivalsRes, bestSellersRes, categoriesRes] =
        await Promise.all([
          getProducts({ featured: true, limit: 5 }),
          getProducts({ sort: "newest", limit: 10 }),
          getProducts({ sort: "popular", limit: 10 }),
          getCategories()
        ]);

      setFeatured(featuredRes.data);
      setNewArrivals(newArrivalsRes.data);
      setBestSellers(bestSellersRes.data);
      setCategories(categoriesRes);
    } catch (err: unknown) {
      const parsedError =
        err instanceof Error ? err : new Error("Failed to load storefront data");
      setError(parsedError);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    featured,
    newArrivals,
    bestSellers,
    categories,
    loading,
    error,
    refetch: fetchData
  };
}
