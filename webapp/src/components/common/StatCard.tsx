import ConstrainedText from "@/components/common/ConstrainedText";

export default function StatCard({
  label,
  value,
  sub,
  valueTooltip,
  subTooltip,
  tone = "default",
  icon: Icon,
}) {
  const toneClass = {
    default: "text-foreground",
    success: "text-success",
    danger: "text-danger",
    warning: "text-warning",
    primary: "text-primary",
  }[tone];

  const iconWrapClass = {
    default: "bg-muted text-muted-foreground",
    success: "bg-success/10 text-success",
    danger: "bg-danger/10 text-danger",
    warning: "bg-warning/10 text-warning",
    primary: "bg-primary/10 text-primary",
  }[tone];

  return (
    <div className="sniper-stat min-w-0">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[13px] text-muted-foreground">{label}</p>
          <ConstrainedText
            as="p"
            variant="cardAmount"
            className={`mt-2 text-[22px] sm:text-[26px] lg:text-[28px] font-semibold tracking-tight tabular-nums leading-snug text-left ${toneClass}`}
            tooltip={valueTooltip}
          >
            {value}
          </ConstrainedText>
          {sub && (
            <ConstrainedText
              as="p"
              variant="card"
              className="mt-1.5 text-xs text-muted-foreground"
              lines={2}
              tooltip={subTooltip}
            >
              {sub}
            </ConstrainedText>
          )}
        </div>
        {Icon && (
          <span className={`flex items-center justify-center size-10 rounded-lg shrink-0 ${iconWrapClass}`}>
            <Icon className="size-[18px]" aria-hidden />
          </span>
        )}
      </div>
    </div>
  );
}
