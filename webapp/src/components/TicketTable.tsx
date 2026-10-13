import { useMemo, useState } from "react";
import { Card, CardHeader } from "@/components/ui-kit/Card";
import { Chip, PriorityBadge, StatusBadge } from "@/components/ui-kit/Chip";
import { TicketForm, type TicketFormValues } from "@/components/forms/TicketForm";
import type { Ticket } from "@/lib/data";
import {
  Search,
  SlidersHorizontal,
  Inbox,
  ArrowLeft,
  X,
  ChevronLeft,
  ChevronRight,
  Ticket as TicketIcon,
  Plus,
  Pencil,
  Trash2,
} from "lucide-react";

type Mode = { kind: "add" } | { kind: "edit"; ticket: Ticket } | null;

export function TicketTable({
  rows,
  title,
  emptyHint,
  idPrefix = "TKT",
}: {
  rows: Ticket[];
  title: string;
  emptyHint: string;
  idPrefix?: string;
}) {
  const [data, setData] = useState<Ticket[]>(rows);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("All");
  const [priority, setPriority] = useState("All");
  const [month, setMonth] = useState("All");
  const [year, setYear] = useState("2026");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [mode, setMode] = useState<Mode>(null);

  const filtered = useMemo(
    () =>
      data.filter((r) => {
        if (q && !`${r.subject} ${r.customer} ${r.id}`.toLowerCase().includes(q.toLowerCase())) return false;
        if (status !== "All" && r.status !== status) return false;
        if (priority !== "All" && r.priority !== priority) return false;
        if (categoryFilter !== "All" && r.category !== categoryFilter) return false;
        return true;
      }),
    [data, q, status, priority, categoryFilter],
  );

  const handleSubmit = (values: TicketFormValues) => {
    if (mode?.kind === "edit") {
      setData((d) =>
        d.map((t) => (t.id === mode.ticket.id ? { ...t, ...values, updated: "just now" } : t)),
      );
    } else {
      const nextNum = data.length + 1042;
      const newTicket: Ticket = {
        id: `${idPrefix}-${nextNum}`,
        subject: values.subject,
        customer: values.customer,
        category: values.category,
        priority: values.priority,
        status: values.status,
        agent: values.agent,
        updated: "just now",
      };
      setData((d) => [newTicket, ...d]);
    }
    setMode(null);
  };

  const handleDelete = (id: string) => setData((d) => d.filter((t) => t.id !== id));

  return (
    <div className="relative">
      <Card>
        <CardHeader
          icon={<TicketIcon className="h-4 w-4" />}
          title={title}
          action={
            <div className="flex items-center gap-2">
              <Chip tone="primary">{filtered.length} results</Chip>
              <button
                onClick={() => setMode({ kind: "add" })}
                className="flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90"
              >
                <Plus className="h-4 w-4" /> New
              </button>
            </div>
          }
        />

        <div className="flex flex-wrap items-center gap-2 px-5 pb-3">
          <PillSelect value={month} onChange={setMonth} options={["All", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]} placeholder="Month" />
          <PillSelect value={year} onChange={setYear} options={["2024", "2025", "2026"]} placeholder="Year" />
          <PillSelect value={categoryFilter} onChange={setCategoryFilter} options={["All", "Billing", "Technical", "Account", "General", "Shipping"]} placeholder="All categories" />
        </div>

        <div className="flex flex-wrap items-center gap-3 px-5 pb-4">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search subject, customer or ID…"
              className="h-10 w-full rounded-lg border border-input bg-card pl-9 pr-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <Select value={status} onChange={setStatus} options={["All", "Open", "In Progress", "Pending", "Resolved", "Escalated"]} label="Status" />
          <Select value={priority} onChange={setPriority} options={["All", "Low", "Medium", "High", "Urgent"]} label="Priority" />
          <button className="flex h-10 items-center gap-2 rounded-lg border border-border bg-card px-3 text-sm font-medium text-muted-foreground hover:bg-accent">
            <SlidersHorizontal className="h-4 w-4" /> More
          </button>
        </div>


        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <Inbox className="h-5 w-5" />
            </div>
            <p className="font-semibold">Nothing here yet</p>
            <p className="text-sm text-muted-foreground">{emptyHint}</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto px-2">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-3 py-2 font-semibold">ID</th>
                    <th className="px-3 py-2 font-semibold">Subject</th>
                    <th className="px-3 py-2 font-semibold">Customer</th>
                    <th className="px-3 py-2 font-semibold">Category</th>
                    <th className="px-3 py-2 font-semibold">Priority</th>
                    <th className="px-3 py-2 font-semibold">Status</th>
                    <th className="px-3 py-2 font-semibold">Agent</th>
                    <th className="px-3 py-2 font-semibold">Updated</th>
                    <th className="px-3 py-2 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((t) => (
                    <tr key={t.id} className="border-t border-border transition-colors hover:bg-accent/50">
                      <td className="px-3 py-3 font-mono text-xs text-muted-foreground">{t.id}</td>
                      <td className="px-3 py-3 font-medium">{t.subject}</td>
                      <td className="px-3 py-3 text-muted-foreground">{t.customer}</td>
                      <td className="px-3 py-3"><Chip tone="primary">{t.category}</Chip></td>
                      <td className="px-3 py-3"><PriorityBadge priority={t.priority} /></td>
                      <td className="px-3 py-3"><StatusBadge status={t.status} /></td>
                      <td className="px-3 py-3 text-muted-foreground">{t.agent}</td>
                      <td className="px-3 py-3 text-muted-foreground">{t.updated}</td>
                      <td className="px-3 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setMode({ kind: "edit", ticket: t })}
                            className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition hover:bg-primary-soft hover:text-primary"
                            aria-label="Edit"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(t.id)}
                            className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition hover:bg-danger-soft hover:text-danger"
                            aria-label="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between border-t border-border px-5 py-3 text-sm text-muted-foreground">
              <span>Showing 1 – {filtered.length} of {filtered.length}</span>
              <div className="flex items-center gap-1">
                <button className="flex h-8 w-8 items-center justify-center rounded-lg border border-border hover:bg-accent"><ChevronLeft className="h-4 w-4" /></button>
                <button className="h-8 min-w-8 rounded-lg bg-primary px-2 text-primary-foreground">1</button>
                <button className="h-8 min-w-8 rounded-lg border border-border px-2 hover:bg-accent">2</button>
                <button className="h-8 min-w-8 rounded-lg border border-border px-2 hover:bg-accent">3</button>
                <button className="flex h-8 w-8 items-center justify-center rounded-lg border border-border hover:bg-accent"><ChevronRight className="h-4 w-4" /></button>
              </div>
            </div>
          </>
        )}
      </Card>

      {mode !== null && (
        <div className="absolute inset-0 z-30 flex items-start justify-center overflow-y-auto rounded-2xl bg-background/70 p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full animate-in fade-in zoom-in-95 duration-200">
            <Card>
              <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    onClick={() => setMode(null)}
                    className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition hover:bg-accent"
                    aria-label="Back"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                  <div>
                    <h2 className="font-display text-lg font-semibold text-foreground">
                      {mode.kind === "edit" ? `Edit ${mode.ticket.id}` : "New ticket"}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {mode.kind === "edit"
                        ? "Update ticket details and save changes"
                        : "Capture a new enquiry or complaint"}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setMode(null)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-accent"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="px-5 py-5">
                <TicketForm
                  formId="ticket-form"
                  initial={mode.kind === "edit" ? mode.ticket : null}
                  onSubmit={handleSubmit}
                />
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-4">
                <button
                  type="button"
                  onClick={() => setMode(null)}
                  className="h-10 rounded-lg border border-border bg-card px-4 text-sm font-medium text-foreground transition hover:bg-accent"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="ticket-form"
                  className="h-10 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90"
                >
                  {mode.kind === "edit" ? "Save changes" : "Create ticket"}
                </button>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

function Select({
  value,
  onChange,
  options,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  label: string;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 appearance-none rounded-lg border border-input bg-card pl-3 pr-8 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {label}: {o}
          </option>
        ))}
      </select>
    </div>
  );
}

export function PillSelect({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder: string;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 appearance-none rounded-full border-2 border-primary/60 bg-card pl-4 pr-9 text-sm font-medium text-foreground transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o === "All" ? placeholder : o}
          </option>
        ))}
      </select>
      <svg className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.06l3.71-3.83a.75.75 0 111.08 1.04l-4.25 4.39a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z" clipRule="evenodd"/></svg>
    </div>
  );
}

