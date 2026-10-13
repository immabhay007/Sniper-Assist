import { useCallback, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const lineClampClass = {
  1: "overflow-hidden text-ellipsis whitespace-nowrap",
  2: "overflow-hidden line-clamp-2 whitespace-normal",
  3: "overflow-hidden line-clamp-3 whitespace-normal",
};

/** Layout presets for card vs table contexts. Line clamp is applied separately via `lines`. */
export const CONSTRAINED_TEXT_VARIANTS = {
  card: "min-w-0 block w-full max-w-full",
  cardMeta: "min-w-0 block w-full max-w-full text-muted-foreground",
  cardAmount: "shrink-0 max-w-[45%] text-right tabular-nums whitespace-nowrap",
  table: "block w-full max-w-full align-top",
  tableDescription: "block w-full max-w-full align-top",
  tableAmount: "block w-full text-right tabular-nums align-top whitespace-nowrap",
};

const VARIANT_LINES = {
  card: 1,
  cardMeta: 2,
  cardAmount: 1,
  table: 1,
  tableDescription: 2,
  tableAmount: 1,
};

const NO_TRUNCATE_VARIANTS = new Set(["cardAmount", "tableAmount"]);

function toTooltipText(children) {
  if (children == null || children === false) return "";
  if (typeof children === "string" || typeof children === "number") return String(children);
  return "";
}

function isTruncated(el, lines) {
  if (!el) return false;
  if (lines <= 1) {
    return el.scrollWidth > el.clientWidth || el.scrollWidth > el.offsetWidth;
  }
  return el.scrollHeight > el.clientHeight || el.scrollWidth > el.clientWidth;
}

/**
 * Truncates long text with ellipsis and shows a custom tooltip on hover when overflowed.
 * Amount variants show a tooltip only when the parent passes `tooltip` (e.g. compact amounts).
 */
export default function ConstrainedText({
  variant = "card",
  as: Component = "span",
  className,
  children,
  title,
  tooltip,
  lines,
  truncate = true,
}) {
  const ref = useRef(null);
  const [open, setOpen] = useState(false);
  const preset = CONSTRAINED_TEXT_VARIANTS[variant] ?? CONSTRAINED_TEXT_VARIANTS.card;
  const shouldTruncate = truncate && !NO_TRUNCATE_VARIANTS.has(variant);
  const lineCount = lines ?? VARIANT_LINES[variant] ?? 1;
  const clampClass = shouldTruncate ? (lineClampClass[lineCount] ?? lineClampClass[1]) : "";
  const tooltipText = title ?? tooltip ?? (shouldTruncate ? toTooltipText(children) : "");
  const isAmount = NO_TRUNCATE_VARIANTS.has(variant);

  const shouldShowTooltip = useCallback(() => {
    if (!tooltipText) return false;
    if (!shouldTruncate) return true;
    return isTruncated(ref.current, lineCount);
  }, [tooltipText, shouldTruncate, lineCount]);

  const handleOpenChange = useCallback(
    (next) => {
      if (!next) {
        setOpen(false);
        return;
      }
      if (shouldShowTooltip()) setOpen(true);
    },
    [shouldShowTooltip],
  );

  const content = (
    <Component
      ref={ref}
      className={cn(
        preset,
        clampClass,
        tooltipText && "cursor-default",
        isAmount ? "text-right" : "text-left",
        className,
      )}
    >
      {children}
    </Component>
  );

  if (!tooltipText) return content;

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip open={open} onOpenChange={handleOpenChange}>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent side="top" className="max-w-sm whitespace-normal break-words text-left">
          {tooltipText}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
