import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  categoriesService,
  Category,
  CreateCategoryDto,
} from "../services/categories.service";
import { apiClient } from "@/services/api";
import { useAuth } from "./AuthContext";

interface CategoriesContextType {
  categories: Category[];
  isLoading: boolean;
  error: string | null;
  loadCategories: () => Promise<void>;
  createCategory: (data: CreateCategoryDto) => Promise<Category>;
  updateCategory: (
    id: string,
    data: Partial<CreateCategoryDto>,
  ) => Promise<Category>;
  deleteCategory: (id: string) => Promise<void>;
}

const CategoriesContext = createContext<CategoriesContextType | undefined>(
  undefined,
);

export function useCategories() {
  const context = useContext(CategoriesContext);
  if (context === undefined) {
    throw new Error("useCategories must be used within CategoriesProvider");
  }
  return context;
}

interface CategoriesProviderProps {
  children: ReactNode;
}

export function CategoriesProvider({ children }: CategoriesProviderProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();

  const loadCategories = async () => {
    if (!isAuthenticated) return;

    setIsLoading(true);
    setError(null);
    try {
      const data = await categoriesService.getAll();
      console.log("📊 Categories loaded:", data); // Debug log
      setCategories(data);
    } catch (err: any) {
      setError(err.message || "Failed to load categories");
      console.error("Load categories error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const createCategory = async (data: CreateCategoryDto): Promise<Category> => {
    try {
      const newCategory = await categoriesService.create(data);
      setCategories((prev) => [...prev, newCategory]);
      // After creating a category, ensure total caps equal monthly income by
      // adjusting the Savings cap accordingly.
      try { await adjustSavingsCap(); } catch (e) { /* ignore */ }
      return newCategory;
    } catch (err: any) {
      setError(err.message || "Failed to create category");
      throw err;
    }
  };

  const updateCategory = async (
    id: string,
    data: Partial<CreateCategoryDto>,
  ): Promise<Category> => {
    try {
      const updatedCategory = await categoriesService.update(id, data);
      setCategories((prev) =>
        prev.map((cat) => (cat.id === id ? updatedCategory : cat)),
      );
      // After updating a category, re-balance Savings cap so totals match income
      try { await adjustSavingsCap(); } catch (e) { /* ignore */ }
      return updatedCategory;
    } catch (err: any) {
      setError(err.message || "Failed to update category");
      throw err;
    }
  };

  const deleteCategory = async (id: string): Promise<void> => {
    try {
      await categoriesService.delete(id);
      setCategories((prev) => prev.filter((cat) => cat.id !== id));
      // After deleting a category, re-balance Savings cap
      try { await adjustSavingsCap(); } catch (e) { /* ignore */ }
    } catch (err: any) {
      setError(err.message || "Failed to delete category");
      throw err;
    }
  };

  // Ensure sum of caps across all categories (including Savings) equals monthly income.
  // Strategy: compute the income from TransactionsContext, sum all non-savings caps,
  // then set the Savings category cap to income - sumOthers (>= 0). If Savings
  // category doesn't exist, create it. Uses categoriesService directly to avoid
  // recursive calls to createCategory/updateCategory which would otherwise loop.
  const adjustSavingsCap = async () => {
    try {
      // fetch current month's transactions and compute income total
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();
      const res = await apiClient.get<any>(`/transactions?month=${month}&year=${year}&limit=500`);
      const items: any[] = res.data?.items ?? [];
      const income = items.filter((t) => t.type === "income").reduce((s, t) => s + (t.amount || 0), 0) ?? 0;
      // compute sum of caps for non-savings categories
      const nonSavings = categories.filter((c) => !((c.name || "").toLowerCase() === "savings" || c.type === "savings"));
      const sumNonSavings = nonSavings.reduce((s, c) => s + (c.cap_amount ?? 0), 0);
      let desiredSavings = Math.max(0, Math.round((income - sumNonSavings) * 100) / 100);

      // find existing savings category
      const savingsCat = categories.find((c) => (c.name || "").toLowerCase() === "savings" || c.type === "savings");

      if (savingsCat) {
        // If the cap is already equal, do nothing
        const current = savingsCat.cap_amount ?? 0;
        if (Math.abs((current || 0) - desiredSavings) < 0.005) return;
        const updated = await categoriesService.update(savingsCat.id, { cap_amount: desiredSavings });
        setCategories((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      } else {
        // Create a new Savings category with desired cap
        const created = await categoriesService.create({ name: "Savings", icon: "bank", type: "savings", cap_amount: desiredSavings });
        setCategories((prev) => [...prev, created]);
      }
    } catch (e) {
      console.error("Failed to adjust savings cap:", e);
      // swallow errors; adjustment is best-effort
    }
  };

  useEffect(() => {
    loadCategories();
  }, [isAuthenticated]);

  const value: CategoriesContextType = {
    categories,
    isLoading,
    error,
    loadCategories,
    createCategory,
    updateCategory,
    deleteCategory,
  };

  return (
    <CategoriesContext.Provider value={value}>
      {children}
    </CategoriesContext.Provider>
  );
}
