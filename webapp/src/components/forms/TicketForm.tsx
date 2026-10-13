import { useEffect, useState } from "react";
import { UploadCloud } from "lucide-react";
import type { Ticket } from "@/lib/data";

export type TicketFormValues = Omit<Ticket, "id" | "updated"> & {
  description?: string;
  date?: string;
  notes?: string;
};

const CATEGORIES: Ticket["category"][] = ["Billing", "Technical", "Account", "General", "Shipping"];
const PRIORITIES: Ticket["priority"][] = ["Low", "Medium", "High", "Urgent"];
const STATUSES: Ticket["status"][] = ["Open", "In Progress", "Pending", "Resolved", "Escalated"];
const AGENTS = ["Aarav Shah", "Riya Kapoor", "Neel Verma", "Priya Nair", "Vikram Singh", "Sara Khan"];

const empty: TicketFormValues = {
  subject: "",
  customer: "",
  category: "General",
  priority: "Medium",
  status: "Open",
  agent: AGENTS[0],
  description: "",
  date: new Date().toISOString().slice(0, 10),
  notes: "",
};

export function TicketForm({
  formId,
  initial,
  onSubmit,
}: {
  formId: string;
  initial?: Partial<TicketFormValues> | null;
  onSubmit: (values: TicketFormValues) => void;
}) {
  const [values, setValues] = useState<TicketFormValues>({ ...empty, ...(initial ?? {}) });
  const [errors, setErrors] = useState<Partial<Record<keyof TicketFormValues, string>>>({});
  const [fileName, setFileName] = useState<string>("");

  useEffect(() => {
    setValues({ ...empty, ...(initial ?? {}) });
    setErrors({});
    setFileName("");
  }, [initial]);

  const set = <K extends keyof TicketFormValues>(k: K, v: TicketFormValues[K]) =>
    setValues((s) => ({ ...s, [k]: v }));

  const validate = () => {
    const e: typeof errors = {};
    if (!values.subject.trim()) e.subject = "Subject is required";
    if (!values.customer.trim()) e.customer = "Customer is required";
    if (!values.agent) e.agent = "Assign someone";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  return (
    <form
      id={formId}
      onSubmit={(ev) => {
        ev.preventDefault();
        if (validate()) onSubmit(values);
      }}
      className="space-y-5"
      noValidate
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field label="Subject" required error={errors.subject}>
          <Input
            value={values.subject}
            onChange={(v) => set("subject", v)}
            placeholder="Short description of the issue"
            invalid={!!errors.subject}
          />
        </Field>
        <Field label="Customer" required error={errors.customer}>
          <Input
            value={values.customer}
            onChange={(v) => set("customer", v)}
            placeholder="Full name"
            invalid={!!errors.customer}
          />
        </Field>

        <Field label="Category" required>
          <Select value={values.category} onChange={(v) => set("category", v as Ticket["category"])} options={CATEGORIES} />
        </Field>
        <Field label="Priority" required>
          <Select value={values.priority} onChange={(v) => set("priority", v as Ticket["priority"])} options={PRIORITIES} />
        </Field>

        <Field label="Status" required>
          <Select value={values.status} onChange={(v) => set("status", v as Ticket["status"])} options={STATUSES} />
        </Field>
        <Field label="Assigned to" required error={errors.agent}>
          <Select value={values.agent} onChange={(v) => set("agent", v)} options={AGENTS} />
        </Field>

        <Field label="Date">
          <Input type="date" value={values.date ?? ""} onChange={(v) => set("date", v)} />
        </Field>
        <Field label="Attachment">
          <label className="flex h-10 cursor-pointer items-center gap-2 rounded-lg border border-dashed border-input bg-background px-3 text-sm text-muted-foreground transition hover:border-primary hover:text-primary">
            <UploadCloud className="h-4 w-4" />
            <span className="truncate">{fileName || "Click to upload (PDF, JPG, PNG)"}</span>
            <input
              type="file"
              className="hidden"
              onChange={(e) => setFileName(e.target.files?.[0]?.name ?? "")}
            />
          </label>
        </Field>
      </div>

      <Field label="Description">
        <textarea
          value={values.description ?? ""}
          onChange={(e) => set("description", e.target.value)}
          rows={4}
          placeholder="Describe the issue, steps taken, expected outcome…"
          className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </Field>

      <Field label="Internal notes">
        <textarea
          value={values.notes ?? ""}
          onChange={(e) => set("notes", e.target.value)}
          rows={2}
          placeholder="Visible to agents only"
          className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </Field>
    </form>
  );
}

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1 text-sm font-medium text-foreground">
        {label}
        {required && <span className="text-danger">*</span>}
      </label>
      {children}
      {error && <p className="text-xs font-medium text-danger">{error}</p>}
    </div>
  );
}

function Input({
  value,
  onChange,
  placeholder,
  type = "text",
  invalid,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  invalid?: boolean;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`h-10 w-full rounded-lg border bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 ${
        invalid
          ? "border-danger focus:border-danger focus:ring-danger/20"
          : "border-input focus:border-primary focus:ring-primary/20"
      }`}
    />
  );
}

function Select({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: readonly string[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-10 w-full appearance-none rounded-lg border border-input bg-background px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
    >
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}
