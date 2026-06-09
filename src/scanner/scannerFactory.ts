import type { AppSettings } from "../types/domain";
import type { Scanner } from "./Scanner";
import { MockScanner } from "./MockScanner";

export const createScanner = async (settings: AppSettings): Promise<Scanner> => {
  if (settings.scannerMode === "browser") {
    const { BrowserScanner } = await import("./BrowserScanner");
    return new BrowserScanner();
  }

  return new MockScanner();
};
