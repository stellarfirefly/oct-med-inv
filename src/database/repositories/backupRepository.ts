import { db } from "../db";
import type { AppSettings, InventoryBatch, InventoryConcept, Product } from "../../types/domain";

export interface InventoryBackup {
  app: "otc-medication-inventory";
  version: 1;
  exportedAt: string;
  data: {
    concepts: InventoryConcept[];
    products: Product[];
    batches: InventoryBatch[];
    settings: AppSettings[];
  };
}

const backupStores = ["concepts", "products", "batches", "settings"] as const;

export const backupRepository = {
  async exportBackup(): Promise<InventoryBackup> {
    const [concepts, products, batches, settings] = await Promise.all([
      db.concepts.toArray(),
      db.products.toArray(),
      db.batches.toArray(),
      db.settings.toArray()
    ]);

    return {
      app: "otc-medication-inventory",
      version: 1,
      exportedAt: new Date().toISOString(),
      data: { concepts, products, batches, settings }
    };
  },

  async importBackup(backup: InventoryBackup) {
    assertBackup(backup);

    await db.transaction("rw", db.concepts, db.products, db.batches, db.settings, async () => {
      for (const storeName of backupStores) {
        await db.table(storeName).clear();
      }

      await Promise.all([
        db.concepts.bulkPut(backup.data.concepts),
        db.products.bulkPut(backup.data.products),
        db.batches.bulkPut(backup.data.batches),
        db.settings.bulkPut(backup.data.settings)
      ]);
    });
  }
};

export const serializeBackup = (backup: InventoryBackup) => JSON.stringify(backup, null, 2);

export const parseBackup = (text: string): InventoryBackup => {
  try {
    const value = JSON.parse(text) as InventoryBackup;
    assertBackup(value);
    return value;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Backup file could not be read.");
  }
};

const assertBackup = (value: InventoryBackup) => {
  if (
    !value ||
    value.app !== "otc-medication-inventory" ||
    value.version !== 1 ||
    !value.data ||
    !Array.isArray(value.data.concepts) ||
    !Array.isArray(value.data.products) ||
    !Array.isArray(value.data.batches) ||
    !Array.isArray(value.data.settings)
  ) {
    throw new Error("This does not look like an OTC Medication Inventory backup.");
  }
};
