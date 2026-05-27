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
    } catch (err: any) {
      setError(err.message || "Failed to delete category");
      throw err;
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
