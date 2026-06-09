import { useCallback, useEffect, useMemo, useState } from "react";
import { backupRepository, type InventoryBackup } from "../database/repositories/backupRepository";
import type { BatchInput, ConceptInput, ConceptPatch, ProductInput, ProductPatch } from "../database/repositories/inventoryRepository";
import { inventoryRepository } from "../database/repositories/inventoryRepository";
import { settingsRepository } from "../database/repositories/settingsRepository";
import { getBatchRows, getConceptSummaries } from "../inventory/calculations";
import { createScanner } from "../scanner/scannerFactory";
import type { AppSettings, InventorySnapshot } from "../types/domain";

export const useInventory = () => {
  const [snapshot, setSnapshot] = useState<InventorySnapshot | undefined>();
  const [message, setMessage] = useState<string>("");

  const refresh = useCallback(async () => {
    setSnapshot(await inventoryRepository.snapshot());
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const run = useCallback(
    async <T,>(action: () => Promise<T>, success: string) => {
      try {
        const result = await action();
        await refresh();
        setMessage(success);
        return result;
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Something went wrong.");
        return undefined;
      }
    },
    [refresh]
  );

  const actions = useMemo(
    () => ({
      addConcept: (input: ConceptInput) => run(() => inventoryRepository.addConcept(input), "Concept added."),
      updateConcept: (id: string, patch: ConceptPatch) =>
        run(() => inventoryRepository.updateConcept(id, patch), "Concept updated."),
      addProduct: (input: ProductInput) => run(() => inventoryRepository.addProduct(input), "Product added."),
      updateProduct: (id: string, patch: ProductPatch) =>
        run(() => inventoryRepository.updateProduct(id, patch), "Product updated."),
      removeProductFromSelection: (id: string) =>
        run(() => inventoryRepository.removeProductFromSelection(id), "Product removed from new batch selection."),
      deleteDeprecatedProducts: (ids: string[]) =>
        run(() => inventoryRepository.deleteDeprecatedProducts(ids), "Deprecated products deleted."),
      addBatch: (input: BatchInput) => run(() => inventoryRepository.addBatch(input), "Batch saved."),
      updateBatchCount: (id: string, containerCount: number) =>
        run(() => inventoryRepository.updateBatchCount(id, containerCount), "Container count updated."),
      removeOneContainer: (id: string) =>
        run(() => inventoryRepository.removeOneContainer(id), "One unopened container removed from inventory."),
      updateSettings: (patch: Partial<Omit<AppSettings, "id">>) =>
        run(() => settingsRepository.update(patch).then(() => undefined), "Settings updated."),
      exportBackup: () => backupRepository.exportBackup(),
      importBackup: (backup: InventoryBackup) => run(() => backupRepository.importBackup(backup), "Backup restored."),
      scan: async () => {
        if (!snapshot) return "";
        try {
          const scanner = await createScanner(snapshot.settings);
          const productCode = await scanner.scan();
          setMessage(`Scanned ${productCode}.`);
          return productCode;
        } catch (error) {
          setMessage(error instanceof Error ? error.message : "Scan failed.");
          return "";
        }
      }
    }),
    [run, snapshot]
  );

  const rows = useMemo(() => (snapshot ? getBatchRows(snapshot) : []), [snapshot]);
  const summaries = useMemo(() => (snapshot ? getConceptSummaries(snapshot) : []), [snapshot]);

  return { snapshot, rows, summaries, actions, message, setMessage, refresh };
};
