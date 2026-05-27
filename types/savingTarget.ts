export interface SavingTarget {
  id: string;
  userId: string;
  month: number; // 1-12
  year: number;
  targetAmount: number;
  currentSaved: number;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSavingTargetRequest {
  month: number;
  year: number;
  targetAmount: number;
  description?: string;
}

export interface UpdateSavingTargetRequest {
  targetAmount?: number;
  currentSaved?: number;
  description?: string;
}
