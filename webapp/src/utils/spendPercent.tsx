/**
 * Share of a category amount relative to a total spend figure.
 * @returns {{ value: number, label: string, barWidth: number }}
 */
export function spendShare(amount, total) {
  const amt = Number(amount) || 0;
  const tot = Number(total) || 0;
  if (amt <= 0 || tot <= 0) {
    return { value: 0, label: "0%", barWidth: 0 };
  }

  const value = (amt / tot) * 100;
  if (value < 0.1) {
    return {
      value,
      label: "<0.1%",
      barWidth: Math.max(value, 0.5),
    };
  }

  const rounded = Math.round(value * 10) / 10;
  const label = Number.isInteger(rounded) ? `${rounded}%` : `${rounded.toFixed(1)}%`;
  return { value, label, barWidth: Math.min(100, value) };
}
