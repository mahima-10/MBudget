// Currency Formatter: Paise to ₹X,XXX.XX
export const formatCurrency = (paise: number): string => {
  const rupees = paise / 100;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(rupees);
};

export const formatCurrencyNoCents = (paise: number): string => {
  const rupees = Math.round(paise / 100);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(rupees);
};

// YYYY-MM to human readable (e.g., "March 2026")
export const formatMonth = (monthStr: string): string => {
  if (!monthStr) return "";
  const [year, month] = monthStr.split("-").map(Number);
  const date = new Date(year, month - 1, 1);
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
};

// Get current month in YYYY-MM
export const getCurrentMonthStr = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
};

export const parseCurrencyInput = (input: string): number => {
  // convert user input (rupees) to paise
  const parsed = parseFloat(input.replace(/,/g, ''));
  if (isNaN(parsed)) return 0;
  return Math.round(parsed * 100);
};
