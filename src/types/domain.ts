export type MedicationForm = "tablet" | "capsule" | "liquid" | "topical" | "other";

export interface InventoryConcept {
  id: string;
  name: string;
  strength: string;
  form: MedicationForm;
  reorderPoint: number;
  reorderAmount?: number;
  isActive?: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  conceptId: string;
  upc: string;
  brand: string;
  packageName: string;
  packageQuantity: number;
  unitLabel: string;
  isActive?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryBatch {
  id: string;
  productId: string;
  expirationDate: string;
  containerCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AppSettings {
  id: "default";
  expirationWarningDays: number;
  scannerMode: "mock" | "browser";
  updatedAt: string;
}

export interface InventorySnapshot {
  concepts: InventoryConcept[];
  products: Product[];
  batches: InventoryBatch[];
  settings: AppSettings;
}

export interface BatchRow {
  batch: InventoryBatch;
  product: Product;
  concept: InventoryConcept;
  totalQuantity: number;
  daysUntilExpiration: number;
  expirationStatus: "expired" | "warning" | "ok";
}

export interface ConceptSummary {
  concept: InventoryConcept;
  totalQuantity: number;
  containerCount: number;
  batchCount: number;
  isLowStock: boolean;
  soonestExpiration?: string;
  status: "expired" | "warning" | "low" | "ok" | "deprecated";
}
