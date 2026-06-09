import { db } from "../db";
import type { AppSettings } from "../../types/domain";
import { isoNow } from "../../utils/date";

export const defaultSettings = (): AppSettings => ({
  id: "default",
  expirationWarningDays: 90,
  scannerMode: "mock",
  updatedAt: isoNow()
});

export const settingsRepository = {
  async get() {
    const settings = await db.settings.get("default");
    if (settings) return settings;

    const created = defaultSettings();
    await db.settings.put(created);
    return created;
  },

  async update(patch: Partial<Omit<AppSettings, "id">>) {
    const next = { ...(await this.get()), ...patch, updatedAt: isoNow() };
    await db.settings.put(next);
    return next;
  }
};
