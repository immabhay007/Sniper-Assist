const XFER_REF = /^XFER-(\d+)-(\d+)$/;

export function parseTransferCategories(ref, categories = []) {
  const match = XFER_REF.exec(ref || "");
  if (!match) return { source: null, target: null };
  const sourceId = Number(match[1]);
  const targetId = Number(match[2]);
  return {
    source: categories.find((c) => c.id === sourceId) || null,
    target: categories.find((c) => c.id === targetId) || null,
  };
}

export function formatTransferRoute(ref, categories = [], fallbackTarget = null) {
  const { source, target } = parseTransferCategories(ref, categories);
  const to = target || fallbackTarget;
  if (source && to) return `${source.short || source.category_name} → ${to.short || to.category_name}`;
  if (to) return `→ ${to.short || to.category_name}`;
  return "Transfer";
}
