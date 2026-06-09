export const todayDateOnly = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};

export const daysBetweenTodayAnd = (dateString: string) => {
  const target = new Date(`${dateString}T00:00:00`);
  const diff = target.getTime() - todayDateOnly().getTime();
  return Math.ceil(diff / 86_400_000);
};

export const isoNow = () => new Date().toISOString();

export const formatDate = (dateString: string) =>
  new Intl.DateTimeFormat(undefined, { year: "numeric", month: "short", day: "numeric" }).format(
    new Date(`${dateString}T00:00:00`)
  );

export const parseExpirationDate = (value: string) => {
  const trimmed = value.trim();
  const isoMatch = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(trimmed);
  const usMatch = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(trimmed);
  const monthYearMatch = /^(\d{1,2})[/-](\d{4})$/.exec(trimmed);

  if (isoMatch) {
    return toIsoDate(Number(isoMatch[1]), Number(isoMatch[2]), Number(isoMatch[3]));
  }

  if (usMatch) {
    return toIsoDate(Number(usMatch[3]), Number(usMatch[1]), Number(usMatch[2]));
  }

  if (monthYearMatch) {
    const month = Number(monthYearMatch[1]);
    const year = Number(monthYearMatch[2]);
    return toIsoDate(year, month, lastDayOfMonth(year, month));
  }

  throw new Error("Use YYYY-MM-DD, MM/DD/YYYY, or MM/YYYY for expiration dates.");
};

const toIsoDate = (year: number, month: number, day: number) => {
  if (year < 1900 || month < 1 || month > 12 || day < 1 || day > lastDayOfMonth(year, month)) {
    throw new Error("Enter a valid expiration date.");
  }

  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
};

const lastDayOfMonth = (year: number, month: number) => new Date(year, month, 0).getDate();
