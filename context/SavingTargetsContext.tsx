import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  CreateSavingTargetRequest,
  SavingTarget,
  UpdateSavingTargetRequest,
} from "../types/savingTarget";
import { savingTargetsService } from "../services/savingTargets.service";
import { useAuth } from "./AuthContext";
import { useCategories } from "./CategoriesContext";

interface SavingTargetsContextType {
  savingTargets: SavingTarget[];
  isLoading: boolean;
  error: string | null;
  loadSavingTargets: () => Promise<void>;
  createSavingTarget: (
    data: CreateSavingTargetRequest,
  ) => Promise<SavingTarget>;
  updateSavingTarget: (
    id: string,
    data: UpdateSavingTargetRequest,
  ) => Promise<SavingTarget>;
  deleteSavingTarget: (id: string) => Promise<void>;
}

const SavingTargetsContext = createContext<
  SavingTargetsContextType | undefined
>(undefined);

export function useSavingTargets() {
  const context = useContext(SavingTargetsContext);
  if (context === undefined) {
    throw new Error(
      "useSavingTargets must be used within SavingTargetsProvider",
    );
  }
  return context;
}

interface SavingTargetsProviderProps {
  children: ReactNode;
}

export function SavingTargetsProvider({
  children,
}: SavingTargetsProviderProps) {
  const [savingTargets, setSavingTargets] = useState<SavingTarget[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated, user } = useAuth();
  const { categories } = useCategories();

  const loadSavingTargets = async () => {
    if (!isAuthenticated) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await savingTargetsService.getAll();
      // Prefer authoritative server data. If backend returns an empty list,
      // synthesize a fallback from the user profile (many deployments expose
      // `savings_target_value` on the user) so the UI can still show a goal.
      if (Array.isArray(response) && response.length > 0) {
        setSavingTargets(response);
      } else {
        const userGoalAmount = (user as any)?.savings_target_value ?? (user as any)?.savings_target_amount ?? (user as any)?.savings_target?.targetAmount ?? null;
        if (userGoalAmount) {
          setSavingTargets([
            {
              id: "user-fallback",
              userId: user?.id ?? "",
              month: new Date().getMonth() + 1,
              year: new Date().getFullYear(),
              targetAmount: userGoalAmount,
              currentSaved: (user as any)?.savings_current_saved ?? 0,
              description: "Fallback from user profile",
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            } as SavingTarget,
          ]);
        } else {
          setSavingTargets([]);
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to load saving targets");
      console.error("Load saving targets error:", err);
      setSavingTargets([]);
    } finally {
      setIsLoading(false);
    }
  };

  const createSavingTarget = async (
    data: CreateSavingTargetRequest,
  ): Promise<SavingTarget> => {
    try {
      const newSavingTarget = await savingTargetsService.create(data);
      setSavingTargets((prev) => [...prev, newSavingTarget]);
      return newSavingTarget;
    } catch (err: any) {
      setError(err.message || "Failed to create saving target");
      throw err;
    }
  };

  const updateSavingTarget = async (
    id: string,
    data: UpdateSavingTargetRequest,
  ): Promise<SavingTarget> => {
    try {
      const updatedSavingTarget = await savingTargetsService.update(id, data);
      setSavingTargets((prev) =>
        prev.map((target) => (target.id === id ? updatedSavingTarget : target)),
      );
      return updatedSavingTarget;
    } catch (err: any) {
      setError(err.message || "Failed to update saving target");
      throw err;
    }
  };

  const deleteSavingTarget = async (id: string): Promise<void> => {
    try {
      await savingTargetsService.delete(id);
      setSavingTargets((prev) => prev.filter((target) => target.id !== id));
    } catch (err: any) {
      setError(err.message || "Failed to delete saving target");
      throw err;
    }
  };

  // Load saving targets when auth state changes and whenever categories
  // change (so updates to the Savings category's `cap_amount` reflect
  // in the saving targets UI). CategoriesProvider is a parent so
  // `useCategories` is available and will trigger this effect.
  useEffect(() => {
    loadSavingTargets();
  }, [isAuthenticated, JSON.stringify(categories)]);

  const value: SavingTargetsContextType = {
    savingTargets,
    isLoading,
    error,
    loadSavingTargets,
    createSavingTarget,
    updateSavingTarget,
    deleteSavingTarget,
  };

  return (
    <SavingTargetsContext.Provider value={value}>
      {children}
    </SavingTargetsContext.Provider>
  );
}
