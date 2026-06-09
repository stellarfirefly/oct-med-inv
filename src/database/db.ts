import Dexie, { type Table } from "dexie";
import type { AppSettings, InventoryBatch, InventoryConcept, Product } from "../types/domain";

export class InventoryDatabase extends Dexie {
  concepts!: Table<InventoryConcept, string>;
  products!: Table<Product, string>;
  batches!: Table<InventoryBatch, string>;
  settings!: Table<AppSettings, string>;

  constructor() {
    super("otcMedicationInventory");

    this.version(1).stores({
      concepts: "id, name, form",
      products: "id, &upc, conceptId, brand",
      batches: "id, productId, expirationDate",
      settings: "id"
    });
  }
}

export const db = new InventoryDatabase();
