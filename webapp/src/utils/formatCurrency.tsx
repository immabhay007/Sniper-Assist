import ENV from "@/config/initializeEnvironment";

/** 10 lakhs — amounts at or above this use compact K/M/B notation. */
export const TEN_LAKHS = 10_00_000;

const COMPACT_TIERS = [
  { divisor: 1_000_000_000_000, suffix: "T" },
  { divisor: 1_000_000_000, suffix: "B" },
  { divisor: 1_000_000, suffix: "M" },
  { divisor: 1_000, suffix: "K" },
];

const inrSymbol = (currency) => (currency === "INR" ? "₹" : currency);

function formatTierNumber(value) {
  if (!Number.isFinite(value) || value <= 0) return "0";
  if (value >= 100) {
    const magnitude = Math.floor(Math.log10(value));
    const divisor = 10 ** Math.max(0, magnitude - 1);
    return (Math.round(value / divisor) / 10).toFixed(1).replace(/\.0$/, "");
  }
  if (value >= 10) return String(Math.round(value * 10) / 10).replace(/\.0$/, "");
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1).replace(/\.0$/, "");
}

function toCompactMagnitude(abs) {
  for (const { divisor, suffix } of COMPACT_TIERS) {
    if (abs >= divisor) {
      return `${formatTierNumber(abs / divisor)}${suffix}`;
    }
  }
  return null;
}

export const formatCurrency = (amount, opts = {}) => {
  const { showSign = false, currency = ENV.DEFAULT_CURRENCY } = opts;
  const n = Number(amount || 0);
  const formatter = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: currency === "INR" ? "INR" : currency,
    maximumFractionDigits: 0,
  });
  const formatted = formatter.format(Math.abs(n));
  if (showSign) return `${n >= 0 ? "+" : "−"}${formatted}`;
  return n < 0 ? `−${formatted}` : formatted;
};

/** Compact display: under 10 lakhs as-is; 10 lakhs+ as ₹XK / ₹XM / ₹XB by magnitude. */
export const formatCurrencyCompact = (amount, opts = {}) => {
  const { showSign = false, currency = ENV.DEFAULT_CURRENCY } = opts;
  const raw = Number(amount || 0);
  const abs = Math.abs(raw);

  if (abs < TEN_LAKHS) return formatCurrency(amount, opts);

  const compact = `${inrSymbol(currency)}${toCompactMagnitude(abs)}`;
  if (showSign) return `${raw >= 0 ? "+" : "−"}${compact}`;
  return raw < 0 ? `−${compact}` : compact;
};

export const isCompactCurrency = (amount) => Math.abs(Number(amount || 0)) >= TEN_LAKHS;
