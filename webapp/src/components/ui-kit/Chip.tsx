import type { ReactNode } from "react";

export type Tone = "primary" | "success" | "warning" | "danger" | "info" | "muted";

const toneClasses: Record<Tone, string> = {
  primary: "bg-primary-soft text-primary",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
  info: "bg-info-soft text-info",
  muted: "bg-muted text-muted-foreground",
};

export function Chip({ tone = "muted", children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium ${toneClasses[tone]}`}>
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, Tone> = {
    open: "info",
    new: "info",
    "in progress": "warning",
    pending: "warning",
    resolved: "success",
    closed: "muted",
    escalated: "danger",
  };
  const tone = map[status.toLowerCase()] ?? "muted";
  return (
    <Chip tone={tone}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status}
    </Chip>
  );
}

export function PriorityBadge({ priority }: { priority: "Low" | "Medium" | "High" | "Urgent" }) {
  const tone: Tone = priority === "Urgent" ? "danger" : priority === "High" ? "warning" : priority === "Medium" ? "info" : "muted";
  return <Chip tone={tone}>{priority}</Chip>;
}
