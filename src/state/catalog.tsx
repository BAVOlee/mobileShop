import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { apiRequest } from "../lib/api";
import type { Product } from "../lib/types";

type CatalogContextValue = {
  products: Product[];
  loading: boolean;
  error: string;
  refresh: () => Promise<void>;
};

const CatalogContext = createContext<CatalogContextValue | null>(null);

export function CatalogProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await apiRequest<{ products: Product[] }>("/api/products", { method: "GET" });
      setProducts(Array.isArray(response.products) ? response.products : []);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The shop catalogue couldn't be loaded.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    void apiRequest<{ products: Product[] }>("/api/products", { method: "GET" })
      .then((response) => {
        if (!active) return;
        setProducts(Array.isArray(response.products) ? response.products : []);
        setError("");
      })
      .catch((caught: unknown) => {
        if (!active) return;
        setError(caught instanceof Error ? caught.message : "The shop catalogue couldn't be loaded.");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  const value = useMemo(() => ({ products, loading, error, refresh }), [products, loading, error, refresh]);
  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export function useCatalog() {
  const context = useContext(CatalogContext);
  if (!context) throw new Error("useCatalog must be used inside CatalogProvider");
  return context;
}
