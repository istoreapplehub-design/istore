import { useCallback, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getCategories, getProducts } from "../services/api";
import { Category, Product } from "../types";

const CACHE_KEY = "home-data-v1";

export interface HomeDataState {
  featured: Product[];
  newArrivals: Product[];
  bestSellers: Product[];
  categories: Category[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

interface HomeCache {
  featured: Product[];
  newArrivals: Product[];
  bestSellers: Product[];
  categories: Category[];
}

export function useHomeData(): HomeDataState {
  const [featured, setFeatured] = useState<Product[]>([]);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [bestSellers, setBestSellers] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoading(true);
    setError(null);
    try {
      const [featuredRes, newArrivalsRes, bestSellersRes, categoriesRes] =
        await Promise.all([
          getProducts({ featured: true, limit: 8 }),
          getProducts({ sort: "newest", limit: 24 }),
          getProducts({ sort: "popular", limit: 24 }),
          getCategories()
        ]);

      setFeatured(featuredRes.data);
      setNewArrivals(newArrivalsRes.data);
      setBestSellers(bestSellersRes.data);
      setCategories(categoriesRes);
      AsyncStorage.setItem(
        CACHE_KEY,
        JSON.stringify({
          featured: featuredRes.data,
          newArrivals: newArrivalsRes.data,
          bestSellers: bestSellersRes.data,
          categories: categoriesRes
        })
      ).catch(() => {});
    } catch (err: unknown) {
      const parsedError =
        err instanceof Error ? err : new Error("Failed to load storefront data");
      setError(parsedError);
    } finally {
      setLoading(false);
    }
  }, []);

  // Stale-while-revalidate: render the previous payload immediately, refresh after.
  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(CACHE_KEY)
      .then((raw) => {
        if (!active || !raw) return;
        const cached = JSON.parse(raw) as HomeCache;
        if (cached.newArrivals?.length || cached.featured?.length) {
          setFeatured(cached.featured || []);
          setNewArrivals(cached.newArrivals || []);
          setBestSellers(cached.bestSellers || []);
          setCategories(cached.categories || []);
          setLoading(false);
        }
      })
      .catch(() => {});
    fetchData({ silent: true });
    return () => {
      active = false;
    };
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
