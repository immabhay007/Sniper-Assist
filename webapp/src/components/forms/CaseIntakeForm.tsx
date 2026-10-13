import { useEffect, useMemo, useState, type ReactNode } from "react";
import { UploadCloud, ChevronDown, Search, X } from "lucide-react";
import { userService } from "@/services/userService";
import { categoryService } from "@/services/categoryService";

export type CaseIntakeValues = {
  customerId: string;
  categoryId: string;
  createdById: string;
  assignedToId: string;
  orderId: string;
  source: string;
  scheduleBookingTime: string;
  servicesBooked: string;
  details: string;
  status: string;
  priority: string;
  slaDeadline: string;
  slaStatus: string;
  firstResponseAt: string;
  resolvedAt: string;
  closedAt: string;
  files: File[];
};

type UserOption = {
  id: number;
  full_name: string;
  email: string;
  phone?: string;
  role_name?: string;
};

type CategoryOption = {
  id: number;
  category_name: string;
  sla_hours?: number;
};

type CustomerOrderOption = {
  id: number;
  scheduled_date: string;
  scheduled_time: string;
};

type CaseKind = "enquiry" | "complaint";

const SOURCE_OPTIONS = ["Phone", "Email", "Web", "Walk-in", "WhatsApp"];
const STATUS_OPTIONS = ["Open", "In Progress", "Pending", "Resolved", "Closed"];
const PRIORITY_OPTIONS = ["Low", "Medium", "High", "Urgent"];
const SLA_STATUS_OPTIONS = ["On Track", "Approaching", "Breached"];

const emptyValues: CaseIntakeValues = {
  customerId: "",
  categoryId: "",
  createdById: "",
  assignedToId: "",
  orderId: "",
  source: SOURCE_OPTIONS[0],
  scheduleBookingTime: "",
  servicesBooked: "",
  details: "",
  status: STATUS_OPTIONS[0],
  priority: PRIORITY_OPTIONS[1],
  slaDeadline: "",
  slaStatus: "",
  firstResponseAt: "",
  resolvedAt: "",
  closedAt: "",
  files: [],
};

function getLoggedInUserId() {
  if (typeof window === "undefined") return "";
  try {
    const raw = window.localStorage.getItem("sniper-care-user");
    if (!raw) return "";
    const parsed = JSON.parse(raw) as { id?: number; user_id?: number };
    return (parsed?.id || parsed?.user_id || "").toString();
  } catch {
    return "";
  }
}

export function CaseIntakeForm({
  formId,
  kind,
  onSubmit,
}: {
  formId: string;
  kind: CaseKind;
  onSubmit: (values: CaseIntakeValues) => void;
}) {
  const [values, setValues] = useState<CaseIntakeValues>(emptyValues);
  const [errors, setErrors] = useState<Partial<Record<keyof CaseIntakeValues, string>>>({});

  // Dropdown states
  const [customers, setCustomers] = useState<UserOption[]>([]);
  const [staff, setStaff] = useState<UserOption[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [loadingDropdowns, setLoadingDropdowns] = useState(true);
  const [orderOptions, setOrderOptions] = useState<CustomerOrderOption[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Search states
  const [customerSearch, setCustomerSearch] = useState("");
  const [createdBySearch, setCreatedBySearch] = useState("");
  const [assignedToSearch, setAssignedToSearch] = useState("");

  const detailsLabel = useMemo(
    () => (kind === "enquiry" ? "Enquiry Details" : "Complaint Details"),
    [kind],
  );

  // Load all dropdowns on mount
  useEffect(() => {
    const loadDropdowns = async () => {
      setLoadingDropdowns(true);
      try {
        console.log("[CaseIntakeForm] Loading dropdowns for kind:", kind);
        
        const [customersData, staffData, categoriesData] = await Promise.all([
          userService.listCustomers(),
          userService.listStaff(),
          kind === "enquiry"
            ? categoryService.listEnquiryCategories()
            : categoryService.listComplaintCategories(),
        ]);
        
        console.log("[CaseIntakeForm] Dropdown data loaded:", {
          customers: customersData?.length,
          staff: staffData?.length,
          categories: categoriesData?.length,
        });
        
        setCustomers(customersData || []);
        setStaff(staffData || []);
        setCategories(categoriesData || []);
        
        // Auto-set createdById to logged-in user if available
        const loggedInId = getLoggedInUserId();
        if (loggedInId) {
          console.log("[CaseIntakeForm] Auto-setting createdById to:", loggedInId);
          setValues((prev) => ({ ...prev, createdById: loggedInId }));
        }
      } catch (err) {
        console.error("[CaseIntakeForm] Failed to load dropdowns:", err);
      } finally {
        setLoadingDropdowns(false);
      }
    };

    void loadDropdowns();
  }, [kind]);

  useEffect(() => {
    const selectedCustomerId = values.customerId.trim();
    if (!selectedCustomerId) {
      setOrderOptions([]);
      setValues((prev) => ({ ...prev, orderId: "" }));
      return;
    }

    const loadOrders = async () => {
      setLoadingOrders(true);
      try {
        const customerOrders = await userService.getCustomerOrders(selectedCustomerId);
        setOrderOptions(customerOrders);
        setValues((prev) => {
          if (!prev.orderId) return prev;
          return customerOrders.some((order) => order.id.toString() === prev.orderId)
            ? prev
            : { ...prev, orderId: "" };
        });
      } catch (err) {
        console.error("[CaseIntakeForm] Failed to load customer orders:", err);
        setOrderOptions([]);
        setValues((prev) => ({ ...prev, orderId: "" }));
      } finally {
        setLoadingOrders(false);
      }
    };

    void loadOrders();
  }, [values.customerId]);

  useEffect(() => {
    if (!values.orderId) {
      setValues((prev) => ({ ...prev, scheduleBookingTime: "" }));
      return;
    }

    const selectedOrder = orderOptions.find((order) => order.id.toString() === values.orderId);
    if (!selectedOrder) {
      return;
    }

    const date = selectedOrder.scheduled_date?.trim();
    const time = selectedOrder.scheduled_time?.trim();
    if (!date || !time) {
      setValues((prev) => ({ ...prev, scheduleBookingTime: "" }));
      return;
    }

    const hhmm = time.slice(0, 5);
    const scheduleValue = `${date}T${hhmm}`;
    setValues((prev) => ({ ...prev, scheduleBookingTime: scheduleValue }));
  }, [values.orderId, orderOptions]);

  const set = <K extends keyof CaseIntakeValues>(k: K, v: CaseIntakeValues[K]) =>
    setValues((prev) => ({ ...prev, [k]: v }));

  const filteredCustomers = useMemo(
    () =>
      customers.filter((c) => {
        const q = customerSearch.toLowerCase();
        return (
          c.full_name.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          (c.phone || "").includes(q)
        );
      }),
    [customers, customerSearch],
  );

  const filteredCreatedBy = useMemo(
    () =>
      staff.filter((u) => {
        const q = createdBySearch.toLowerCase();
        return (
          u.full_name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          (u.phone || "").includes(q)
        );
      }),
    [staff, createdBySearch],
  );

  const filteredAssignedTo = useMemo(
    () =>
      staff.filter((u) => {
        const q = assignedToSearch.toLowerCase();
        return (
          u.full_name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          (u.phone || "").includes(q)
        );
      }),
    [staff, assignedToSearch],
  );

  const validate = () => {
    const nextErrors: typeof errors = {};
    if (!values.customerId.trim()) nextErrors.customerId = "Customer is required";
    if (!values.categoryId.trim()) nextErrors.categoryId = "Category is required";
    if (!values.createdById.trim()) nextErrors.createdById = "Created by is required";
    if (!values.source.trim()) nextErrors.source = "Source is required";
    if (!values.details.trim()) nextErrors.details = `${detailsLabel} is required`;
    if (!values.status.trim()) nextErrors.status = "Status is required";
    if (!values.priority.trim()) nextErrors.priority = "Priority is required";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const selectedCustomer = customers.find((c) => c.id.toString() === values.customerId);
  const selectedCreatedBy = staff.find((u) => u.id.toString() === values.createdById);
  const selectedAssignedTo = staff.find((u) => u.id.toString() === values.assignedToId);
  const selectedCategory = categories.find((c) => c.id.toString() === values.categoryId);

  return (
    <form
      id={formId}
      noValidate
      className="space-y-5"
      onSubmit={(ev) => {
        ev.preventDefault();
        if (validate()) onSubmit(values);
      }}
    >
      {loadingDropdowns ? (
        <div className="text-sm text-muted-foreground">Loading form options...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <SearchableSelect
              label="Customer"
              required
              error={errors.customerId}
              searchValue={customerSearch}
              onSearchChange={setCustomerSearch}
              value={values.customerId}
              onChange={(v) => {
                set("customerId", v);
                set("orderId", "");
                setCustomerSearch("");
              }}
              options={filteredCustomers}
              displayKey={(opt) => `${opt.full_name} (${opt.email})`}
              selectedDisplay={selectedCustomer ? `${selectedCustomer.full_name}` : "Select customer"}
            />

            <SearchableSelect
              label="Category"
              required
              error={errors.categoryId}
              searchValue=""
              onSearchChange={() => {}}
              value={values.categoryId}
              onChange={(v) => set("categoryId", v)}
              options={categories}
              displayKey={(opt) => opt.category_name}
              selectedDisplay={selectedCategory ? selectedCategory.category_name : "Select category"}
            />

            <SearchableSelect
              label="Created By"
              required
              error={errors.createdById}
              searchValue={createdBySearch}
              onSearchChange={setCreatedBySearch}
              value={values.createdById}
              onChange={(v) => {
                set("createdById", v);
                setCreatedBySearch("");
              }}
              options={filteredCreatedBy}
              displayKey={(opt) => `${opt.full_name} (${opt.role_name})`}
              selectedDisplay={selectedCreatedBy ? selectedCreatedBy.full_name : "Select staff"}
            />

            <SearchableSelect
              label="Assigned To"
              required={false}
              error={errors.assignedToId}
              searchValue={assignedToSearch}
              onSearchChange={setAssignedToSearch}
              value={values.assignedToId}
              onChange={(v) => {
                set("assignedToId", v);
                setAssignedToSearch("");
              }}
              options={filteredAssignedTo}
              displayKey={(opt) => `${opt.full_name} (${opt.role_name})`}
              selectedDisplay={selectedAssignedTo ? selectedAssignedTo.full_name : "Select staff (optional)"}
            />

            <Field label="Order">
              <select
                value={values.orderId}
                onChange={(e) => set("orderId", e.target.value)}
                disabled={!values.customerId || loadingOrders}
                className="h-10 w-full appearance-none rounded-lg border border-input bg-background px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <option value="">
                  {!values.customerId
                    ? "Select customer first"
                    : loadingOrders
                      ? "Loading orders..."
                      : "Select order"}
                </option>
                {orderOptions.map((order) => (
                  <option key={order.id} value={order.id.toString()}>
                    {order.id}
                  </option>
                ))}
              </select>
            </Field>

            <Field
              label={kind === "enquiry" ? "Enquiry Source" : "Complaint Source"}
              required
              error={errors.source}
            >
              <Select value={values.source} onChange={(v) => set("source", v)} options={SOURCE_OPTIONS} />
            </Field>

            <Field label="Schedule Booking Time">
              <Input
                type="datetime-local"
                value={values.scheduleBookingTime}
                onChange={(v) => set("scheduleBookingTime", v)}
              />
            </Field>

            <Field label="Status" required error={errors.status}>
              <Select value={values.status} onChange={(v) => set("status", v)} options={STATUS_OPTIONS} />
            </Field>

            <Field label="Priority" required error={errors.priority}>
              <Select value={values.priority} onChange={(v) => set("priority", v)} options={PRIORITY_OPTIONS} />
            </Field>

            <Field label="SLA Deadline">
              <Input type="datetime-local" value={values.slaDeadline} onChange={(v) => set("slaDeadline", v)} />
            </Field>

            <Field label="SLA Status">
              <Select
                value={values.slaStatus}
                onChange={(v) => set("slaStatus", v)}
                options={["", ...SLA_STATUS_OPTIONS]}
              />
            </Field>

            <Field label="First Response At">
              <Input
                type="datetime-local"
                value={values.firstResponseAt}
                onChange={(v) => set("firstResponseAt", v)}
              />
            </Field>

            <Field label="Resolved At">
              <Input type="datetime-local" value={values.resolvedAt} onChange={(v) => set("resolvedAt", v)} />
            </Field>

            <Field label="Closed At">
              <Input type="datetime-local" value={values.closedAt} onChange={(v) => set("closedAt", v)} />
            </Field>

            <Field label="Attachments (single or multiple)">
              <label className="flex h-10 cursor-pointer items-center gap-2 rounded-lg border border-dashed border-input bg-background px-3 text-sm text-muted-foreground transition hover:border-primary hover:text-primary">
                <UploadCloud className="h-4 w-4" />
                <span className="truncate">
                  {values.files.length > 0
                    ? `${values.files.length} file(s) selected`
                    : "Upload file(s)"}
                </span>
                <input
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => set("files", Array.from(e.target.files || []))}
                />
              </label>
            </Field>
          </div>

          <Field label={detailsLabel} required error={errors.details}>
            <textarea
              value={values.details}
              onChange={(e) => set("details", e.target.value)}
              rows={4}
              placeholder={kind === "enquiry" ? "Enter enquiry details" : "Enter complaint details"}
              className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </Field>
        </>
      )}
    </form>
  );
}

type SearchableSelectProps<T> = {
  label: string;
  required?: boolean;
  error?: string;
  searchValue: string;
  onSearchChange: (v: string) => void;
  value: string;
  onChange: (id: string) => void;
  options: T[];
  displayKey: (opt: T) => string;
  selectedDisplay: string;
};

function SearchableSelect<T extends { id: number }>({
  label,
  required,
  error,
  searchValue,
  onSearchChange,
  value,
  onChange,
  options,
  displayKey,
  selectedDisplay,
}: SearchableSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Field label={label} required={required} error={error}>
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`h-10 w-full appearance-none rounded-lg border bg-background px-3 text-sm text-left focus:border-primary focus:outline-none focus:ring-2 ${
            error ? "border-danger focus:ring-danger/20" : "border-input focus:ring-primary/20"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={value ? "text-foreground" : "text-muted-foreground"}>
              {selectedDisplay}
            </span>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </div>
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 right-0 z-10 mt-1 rounded-lg border border-input bg-background shadow-lg">
            <div className="p-2 border-b border-border">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={searchValue}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder="Search..."
                  className="h-8 w-full rounded border border-input bg-background pl-8 pr-2 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
            <div className="max-h-48 overflow-y-auto">
              {options.length === 0 ? (
                <div className="p-2 text-sm text-muted-foreground">No options found</div>
              ) : (
                options.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      onChange(opt.id.toString());
                      setIsOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-accent ${
                      value === opt.id.toString() ? "bg-primary/10 text-primary font-medium" : ""
                    }`}
                  >
                    {displayKey(opt)}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </Field>
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

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: ReactNode;
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
        <option key={o || "__empty"} value={o}>
          {o || "Select"}
        </option>
      ))}
    </select>
  );
}
