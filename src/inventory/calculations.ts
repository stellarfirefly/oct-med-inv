import type { BatchRow, ConceptSummary, InventorySnapshot } from "../types/domain";
import { daysBetweenTodayAnd } from "../utils/date";

export const getBatchRows = (snapshot: InventorySnapshot): BatchRow[] => {
  const productsById = new Map(snapshot.products.map((product) => [product.id, product]));
  const conceptsById = new Map(snapshot.concepts.map((concept) => [concept.id, concept]));

  return snapshot.batches
    .map((batch) => {
      const product = productsById.get(batch.productId);
      const concept = product ? conceptsById.get(product.conceptId) : undefined;
      if (!product || !concept) return undefined;

      const daysUntilExpiration = daysBetweenTodayAnd(batch.expirationDate);
      const expirationStatus =
        daysUntilExpiration < 0 ? "expired" : daysUntilExpiration <= snapshot.settings.expirationWarningDays ? "warning" : "ok";

      return {
        batch,
        product,
        concept,
        totalQuantity: batch.containerCount * product.packageQuantity,
        daysUntilExpiration,
        expirationStatus
      } satisfies BatchRow;
    })
    .filter((row): row is BatchRow => Boolean(row))
    .sort(compareBatchRows);
};

const compareBatchRows = (left: BatchRow, right: BatchRow) =>
  compareText(left.concept.name, right.concept.name) ||
  compareText(left.concept.strength, right.concept.strength) ||
  compareText(left.product.brand, right.product.brand) ||
  compareText(left.product.packageName, right.product.packageName) ||
  left.batch.expirationDate.localeCompare(right.batch.expirationDate);

const compareText = (left: string, right: string) => left.localeCompare(right, undefined, { numeric: true, sensitivity: "base" });

export const getConceptSummaries = (snapshot: InventorySnapshot): ConceptSummary[] => {
  const rows = getBatchRows(snapshot);

  return snapshot.concepts.map((concept) => {
    const conceptRows = rows.filter((row) => row.concept.id === concept.id);
    const totalQuantity = conceptRows.reduce((sum, row) => sum + row.totalQuantity, 0);
    const containerCount = conceptRows.reduce((sum, row) => sum + row.batch.containerCount, 0);
    const soonestExpiration = conceptRows.map((row) => row.batch.expirationDate).sort()[0];
    const hasExpired = conceptRows.some((row) => row.expirationStatus === "expired");
    const hasWarning = conceptRows.some((row) => row.expirationStatus === "warning");
    const isDeprecated = concept.isActive === false;
    const isLowStock = !isDeprecated && totalQuantity <= concept.reorderPoint;

    return {
      concept,
      totalQuantity,
      containerCount,
      batchCount: conceptRows.length,
      isLowStock,
      soonestExpiration,
      status: isDeprecated ? "deprecated" : hasExpired ? "expired" : hasWarning ? "warning" : isLowStock ? "low" : "ok"
    };
  });
};
