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
  const { isAuthenticated } = useAuth();

  const loadSavingTargets = async () => {
    if (!isAuthenticated) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await savingTargetsService.getAll();
      setSavingTargets(Array.isArray(response) ? response : []);
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

  useEffect(() => {
    loadSavingTargets();
  }, [isAuthenticated]);

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
