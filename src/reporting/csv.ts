import type { BatchRow, ConceptSummary } from "../types/domain";
import { formatDate } from "../utils/date";

const csvCell = (value: string | number | undefined) => `"${String(value ?? "").replace(/"/g, '""')}"`;

export type ReportMode = "all" | "reorder";

export const buildInventoryCsv = (summaries: ConceptSummary[], rows: BatchRow[], mode: ReportMode = "all") => {
  if (mode === "reorder") {
    const lines = [
      ["Concept", "Quantity", "Reorder Quantity", "Containers", "Soonest Expiration"].map(csvCell).join(",")
    ];

    summaries.filter((summary) => summary.isLowStock).forEach((summary) => {
      lines.push(
        [
          summary.concept.name,
          summary.totalQuantity,
          summary.concept.reorderAmount,
          summary.containerCount,
          summary.soonestExpiration ? formatDate(summary.soonestExpiration) : "No stock"
        ]
          .map(csvCell)
          .join(",")
      );
    });

    return lines.join("\n");
  }

  const lines = [
    ["Section", "Concept", "Product", "Product Code", "Expiration", "Containers", "Package Qty", "Total Qty", "Reorder Amount", "Status"].map(csvCell).join(",")
  ];

  summaries.forEach((summary) => {
    lines.push(
      [
        "Concept",
        summary.concept.name,
        "",
        "",
        summary.soonestExpiration ? formatDate(summary.soonestExpiration) : "",
        summary.containerCount,
        "",
        summary.totalQuantity,
        summary.concept.reorderAmount,
        summary.isLowStock ? "reorder" : summary.status
      ]
        .map(csvCell)
        .join(",")
    );
  });

  rows.forEach((row) => {
    lines.push(
      [
        "Batch",
        row.concept.name,
        `${row.product.brand} ${row.product.packageName}`,
        row.product.upc,
        formatDate(row.batch.expirationDate),
        row.batch.containerCount,
        row.product.packageQuantity,
        row.totalQuantity,
        row.concept.reorderAmount,
        row.expirationStatus
      ]
        .map(csvCell)
        .join(",")
    );
  });

  return lines.join("\n");
};

export const downloadCsv = (filename: string, content: string) => {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};
