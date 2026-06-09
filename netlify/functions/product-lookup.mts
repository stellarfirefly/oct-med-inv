import type { Config } from "@netlify/functions";

interface ProductLookupResult {
  source: "UPCitemdb" | "Open Food Facts";
  upc: string;
  brand: string;
  packageName: string;
  packageQuantity: number;
  unitLabel: string;
}

interface UpcItemDbResponse {
  code?: string;
  items?: Array<{
    title?: string;
    brand?: string;
    description?: string;
    size?: string;
  }>;
}

interface OpenFoodFactsResponse {
  status?: number;
  product?: {
    product_name?: string;
    generic_name?: string;
    brands?: string;
    quantity?: string;
    product_quantity?: string | number;
    product_quantity_unit?: string;
  };
}

export default async (req: Request) => {
  if (req.method !== "GET") {
    return jsonResponse({ error: "Method not allowed." }, 405);
  }

  const upc = normalizeLookupCode(new URL(req.url).searchParams.get("upc") || "");

  if (!upc) {
    return jsonResponse({ error: "UPC or EAN is required." }, 400);
  }

  if (!isNumericLookupCode(upc)) {
    return jsonResponse({ error: "Online lookup only supports numeric UPC/EAN codes." }, 400);
  }

  try {
    const upcItem = await lookupUpcItemDb(upc);
    if (upcItem) {
      return jsonResponse(upcItem);
    }

    const foodFacts = await lookupOpenFoodFacts(upc);
    if (foodFacts) {
      return jsonResponse(foodFacts);
    }

    return jsonResponse({ error: "No product details found for that UPC/EAN." }, 404);
  } catch {
    return jsonResponse({ error: "Product lookup failed." }, 502);
  }
};

export const config: Config = {
  path: "/api/product-lookup"
};

const lookupUpcItemDb = async (upc: string): Promise<ProductLookupResult | undefined> => {
  const response = await fetch(`https://api.upcitemdb.com/prod/trial/lookup?upc=${encodeURIComponent(upc)}`, {
    headers: {
      Accept: "application/json"
    }
  });

  if (!response.ok) {
    return undefined;
  }

  const payload = (await response.json()) as UpcItemDbResponse;
  const item = payload.items?.[0];

  if (!item || payload.code !== "OK") {
    return undefined;
  }

  return toLookupResult({
    source: "UPCitemdb",
    upc,
    brand: item.brand,
    packageName: item.title || item.description,
    quantityText: [item.size, item.title, item.description].filter(Boolean).join(" ")
  });
};

const lookupOpenFoodFacts = async (upc: string): Promise<ProductLookupResult | undefined> => {
  const fields = [
    "product_name",
    "generic_name",
    "brands",
    "quantity",
    "product_quantity",
    "product_quantity_unit"
  ].join(",");

  const response = await fetch(
    `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(upc)}.json?fields=${fields}`,
    {
      headers: {
        Accept: "application/json"
      }
    }
  );

  if (!response.ok) {
    return undefined;
  }

  const payload = (await response.json()) as OpenFoodFactsResponse;
  const product = payload.product;

  if (payload.status !== 1 || !product) {
    return undefined;
  }

  return toLookupResult({
    source: "Open Food Facts",
    upc,
    brand: firstCsvValue(product.brands),
    packageName: product.product_name || product.generic_name,
    quantityText: [
      product.quantity,
      product.product_quantity && product.product_quantity_unit
        ? `${product.product_quantity} ${product.product_quantity_unit}`
        : undefined,
      product.product_name,
      product.generic_name
    ]
      .filter(Boolean)
      .join(" ")
  });
};

const toLookupResult = ({
  source,
  upc,
  brand,
  packageName,
  quantityText
}: {
  source: ProductLookupResult["source"];
  upc: string;
  brand?: string;
  packageName?: string;
  quantityText?: string;
}): ProductLookupResult | undefined => {
  if (!packageName && !brand) {
    return undefined;
  }

  const quantity = inferPackageQuantity(quantityText || packageName || "");

  return {
    source,
    upc,
    brand: cleanText(brand) || "Unknown brand",
    packageName: cleanText(packageName) || cleanText(brand) || "Unknown product",
    packageQuantity: quantity.packageQuantity,
    unitLabel: quantity.unitLabel
  };
};

const inferPackageQuantity = (text: string): Pick<ProductLookupResult, "packageQuantity" | "unitLabel"> => {
  const normalized = text.toLowerCase();
  const countMatch = normalized.match(
    /\b(\d+(?:\.\d+)?)\s*(tablets?|tabs?|caplets?|capsules?|caps?|softgels?|gelcaps?|gummies?|lozenges?|packets?|patches?|count|ct)\b/
  );

  if (countMatch) {
    return {
      packageQuantity: Math.max(1, Math.round(Number(countMatch[1]))),
      unitLabel: normalizeUnitLabel(countMatch[2])
    };
  }

  const volumeMatch = normalized.match(/\b(\d+(?:\.\d+)?)\s*(fl\.?\s*oz|fluid ounces?|ounces?|oz|ml|milliliters?)\b/);
  if (volumeMatch) {
    return {
      packageQuantity: Number(volumeMatch[1]),
      unitLabel: normalizeUnitLabel(volumeMatch[2])
    };
  }

  return {
    packageQuantity: 1,
    unitLabel: "containers"
  };
};

const normalizeUnitLabel = (unit: string) => {
  const normalized = unit.toLowerCase().replace(/\./g, "").replace(/\s+/g, " ").trim();

  if (["tablet", "tablets", "tab", "tabs"].includes(normalized)) return "tablets";
  if (["caplet", "caplets"].includes(normalized)) return "caplets";
  if (["capsule", "capsules", "cap", "caps"].includes(normalized)) return "capsules";
  if (["softgel", "softgels", "gelcap", "gelcaps"].includes(normalized)) return "softgels";
  if (["gummy", "gummies"].includes(normalized)) return "gummies";
  if (["lozenge", "lozenges"].includes(normalized)) return "lozenges";
  if (["packet", "packets"].includes(normalized)) return "packets";
  if (["patch", "patches"].includes(normalized)) return "patches";
  if (["count", "ct"].includes(normalized)) return "units";
  if (["fl oz", "fluid ounce", "fluid ounces"].includes(normalized)) return "fl oz";
  if (["ounce", "ounces", "oz"].includes(normalized)) return "oz";
  if (["ml", "milliliter", "milliliters"].includes(normalized)) return "mL";

  return normalized || "units";
};

const normalizeLookupCode = (value: string) => value.replace(/[^a-z0-9]/gi, "").toUpperCase().trim();

const isNumericLookupCode = (value: string) => /^\d+$/.test(value);

const cleanText = (value?: string) => value?.replace(/\s+/g, " ").trim() ?? "";

const firstCsvValue = (value?: string) => cleanText(value?.split(",")[0]);

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json"
    }
  });
