import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Phone, Mail, Globe, User, MessageCircle, UploadCloud } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { Card } from "@/components/ui-kit/Card";
import { categoryService } from "@/services/categoryService";
import { userService } from "@/services/userService";
import { statusService, type StatusMaster } from "@/services/statusService";
import { toast } from "@/utils/toast";
import { getApiErrorMessage } from "@/utils/apiError";
import { isAxiosError } from "axios";
import api from "@/config/axios";
import { getCategoryIcon } from "@/config/categoryIcons";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export const Route = createFileRoute("/_app/complaints/create")({
  component: ComplaintCreatePage,
});

// Unified error handler – extracts detail and shows ONE toast
const handleApiError = (error: unknown, defaultMessage: string) => {
  let message = defaultMessage;
  if (isAxiosError(error)) {
    const detail = (error.response?.data as { detail?: string })?.detail;
    if (detail) {
      message = detail;
    } else if (error.response?.status === 403) {
      message = "You don't have permission to perform this action.";
    }
  }
  toast.error(message);
  return message; // for inline error display
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

// Extended category type with icon & color
type CategoryFull = {
  id: number;
  category_name: string;
  category_icon: string;
  color_code: string;
  sla_hours: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type StaffOption = {
  id: number;
  full_name: string;
  role_name?: string;
};

const SOURCE_OPTIONS = [
  { label: "Phone", icon: Phone },
  { label: "Email", icon: Mail },
  { label: "Walk-in", icon: User },
];

const PRIORITY_OPTIONS = ["Low", "Medium", "High", "Urgent"];

export default function ComplaintCreatePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [complaintCategories, setComplaintCategories] = useState<CategoryFull[]>([]);
  const [staffOptions, setStaffOptions] = useState<StaffOption[]>([]);
  const [statusOptions, setStatusOptions] = useState<StatusMaster[]>([]);
  const [createdById, setCreatedById] = useState("");
  const [formError, setFormError] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerResults, setCustomerResults] = useState<any[]>([]);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [searchingCustomer, setSearchingCustomer] = useState(false);
  const [isExistingCustomer, setIsExistingCustomer] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const queryClient = useQueryClient();

  // Ref to prevent duplicate API calls (strict mode double mount)
  const isFetching = useRef(false);

  const [form, setForm] = useState({
    customer: "",
    categoryId: "",
    orderId: "",
    complaintSource: SOURCE_OPTIONS[0].label,
    complaintDetails: "",
    priority: PRIORITY_OPTIONS[1],
    assignedToId: "",
    slaStatus: "",
    slaDeadline: "",
    complaintFiles: [] as File[],
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    status: "",
    servicesBooked: "",
    scheduledBookingTime: "",
  });

  const goBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      window.history.back();
      return;
    }
    navigate({ to: "/complaints" });
  };

  const selectCustomer = (customer: any) => {
    setForm((prev) => ({
      ...prev,
      customer: customer.full_name || "",
      email: customer.email || "",
      phone: customer.phone || "",
      address: customer.address || "",
      city: customer.city || "",
      state: customer.state || "",
    }));

    setCustomerSearch(customer.full_name || "");
    setShowCustomerDropdown(false);
    setIsExistingCustomer(true);
    setSelectedCustomerId(customer.id);
  };

  useEffect(() => {
    if (isExistingCustomer) {
      return;
    }

    const controller = new AbortController();

    const searchCustomers = async () => {
      const q = customerSearch.trim();

      if (q.length < 2) {
        setCustomerResults([]);
        return;
      }

      try {
        setSearchingCustomer(true);

        const response = await api.get(
          `/customers/search?q=${encodeURIComponent(q)}&limit=10`,
          { signal: controller.signal }
        );

        setCustomerResults(response.data || []);
        setShowCustomerDropdown(true);
      } catch (error) {
        // Don't show toast for aborted requests or 404 (no results)
        if (!isAxiosError(error) || error.code !== "ERR_CANCELED") {
          if (isAxiosError(error) && error.response?.status !== 404) {
            handleApiError(error, "Failed to search customers.");
          }
        }
        setCustomerResults([]);
      } finally {
        setSearchingCustomer(false);
      }
    };

    const timer = setTimeout(searchCustomers, 400);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [customerSearch, isExistingCustomer]);

  useEffect(() => {
    const handleClick = () => {
      setShowCustomerDropdown(false);
    };

    document.addEventListener("click", handleClick);

    return () => {
      document.removeEventListener("click", handleClick);
    };
  }, []);

  useEffect(() => {
    const load = async () => {
      if (isFetching.current) return;
      isFetching.current = true;
      setLoading(true);

      try {
        const [categoriesRes, staffRes, statuses] = await Promise.all([
          categoryService.listComplaintCategories(),
          api.get("/users", {
            params: {
              active_only: true,
              include_deleted: false,
            },
          }),
          statusService.getStatuses(),
        ]);

        const categories = categoriesRes || [];
        const staff = staffRes?.data || [];

        setComplaintCategories(Array.isArray(categories) ? categories : []);
        setStaffOptions(Array.isArray(staff) ? staff : []);
        setStatusOptions(statuses);

        if (statuses.length > 0) {
          setForm((prev) => ({
            ...prev,
            status: statuses[0].status_name,
          }));
        }

        const userId = getLoggedInUserId();
        setCreatedById(userId);
      } catch (err) {
        const msg = handleApiError(err, "Failed to load form options.");
        // Optionally set a global error state if needed
      } finally {
        setLoading(false);
        isFetching.current = false;
      }
    };

    void load();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const requiredFields = [
      { key: 'customer', label: 'Customer' },
      { key: 'categoryId', label: 'Category' },
      { key: 'email', label: 'Email' },
      { key: 'priority', label: 'Priority' },
      { key: 'status', label: 'Status' },
    ];
    const missing = requiredFields.filter(f => !form[f.key as keyof typeof form]);
    if (missing.length) {
      setFormError(`Please fill all required fields: ${missing.map(f => f.label).join(', ')}`);
      return;
    }

    setFormError("");
    setSaving(true);
    try {
      const nameToStatusId = Object.fromEntries(
        statusOptions.map((s) => [s.status_name, s.id])
      );
      const statusId = nameToStatusId[form.status];
      if (!statusId) {
        throw new Error("Invalid status selected");
      }

      const now = new Date();

      const formData = new FormData();
      formData.append("customer_name", form.customer);
      formData.append("email", form.email);
      formData.append("address", form.address);
      formData.append("city", form.city);
      formData.append("state", form.state);
      formData.append("phone", form.phone);
      formData.append("category_id", form.categoryId);
      formData.append("created_by", createdById);
      if (form.assignedToId) formData.append("assigned_to", form.assignedToId);
      if (form.orderId.trim()) formData.append("order_id", form.orderId.trim());
      formData.append("complaint_source", form.complaintSource);
      formData.append("services_booked", form.servicesBooked || " ");
      formData.append("complaint_details", form.complaintDetails || " ");
      formData.append("status_id", String(statusId));
      formData.append("priority", form.priority);
      formData.append("is_new_customer", isExistingCustomer ? "0" : "1");
      formData.append("services_booked", form.servicesBooked || "");
      formData.append("scheduled_booking_time", form.scheduledBookingTime || "");
      formData.append("created_at", now.toISOString());
      formData.append("timezone_str", Intl.DateTimeFormat().resolvedOptions().timeZone);
      if (selectedCustomerId) {
        formData.append("customer_id", String(selectedCustomerId));
      }
      if (form.slaDeadline) formData.append("sla_deadline", new Date(form.slaDeadline).toISOString());
      if (form.slaStatus) formData.append("sla_status", form.slaStatus);
      if (form.complaintFiles?.length) {
        form.complaintFiles.forEach((file) => {
          formData.append("files", file);
        });
      }
      await api.post("/complaints/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      await queryClient.invalidateQueries({
        queryKey: ["enquiries"],
      });
      toast.success("Complaint created successfully.");
      navigate({ to: "/complaints" });
    } catch (error) {
      const msg = handleApiError(error, "Failed to create complaint.");
      setFormError(msg);
    } finally {
      setSaving(false);
    }
  };

  const removeFile = (index: number) => {
    setForm((p) => ({
      ...p,
      complaintFiles: p.complaintFiles.filter((_, i) => i !== index),
    }));
  };

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex items-center justify-between gap-4 border-b border-border px-5 py-4">
          <button
            type="button"
            onClick={goBack}
            className="flex h-9 items-center gap-2 rounded-lg border border-border bg-card px-3 text-sm font-medium text-foreground transition hover:bg-accent"
            aria-label="Back"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Complaint
          </button>
        </div>

        <div className="px-5 py-5">
          {loading ? (
            <div className="text-sm text-muted-foreground">Loading form options...</div>
          ) : (
            <form id="create-complaint-form" onSubmit={handleSubmit} className="space-y-4">
              {/* ─── 1. Category cards (square) ─── */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Category *</label>
                <div className="flex flex-wrap gap-3">
                  {complaintCategories.map((cat) => {
                    const Icon = getCategoryIcon(cat.category_icon);
                    const isSelected = form.categoryId === String(cat.id);
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setForm((p) => ({ ...p, categoryId: String(cat.id) }))}
                        className={`relative flex w-20 flex-col items-center justify-center gap-0.5 rounded-lg border text-center text-xs font-medium transition-all ${
                          isSelected ? "border-2 shadow-md" : "hover:shadow-sm"
                        }`}
                        style={{
                          borderColor: cat.color_code,
                          backgroundColor: isSelected
                            ? `${cat.color_code}35`
                            : `${cat.color_code}15`,
                          aspectRatio: "1 / 1",
                        }}
                      >
                        <Icon className="h-6 w-6" style={{ color: cat.color_code }} />
                        <span
                          className="block w-full truncate px-1 leading-tight"
                          title={cat.category_name}
                        >
                          {cat.category_name}
                        </span>
                        {isSelected && (
                          <span
                            className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold text-white shadow-sm"
                            style={{ backgroundColor: cat.color_code }}
                          >
                            ✓
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ─── 2. Customer, Email, Phone (3 cols) ─── */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {/* Customer search */}
                <div className="space-y-1.5 relative">
                  <label className="text-sm font-medium text-foreground">Customer *</label>
                  <input
                    type="text"
                    value={customerSearch}
                    onChange={(e) => {
                      const value = e.target.value;
                      setCustomerSearch(value);
                      setForm((p) => ({ ...p, customer: value }));
                      setShowCustomerDropdown(true);
                      setIsExistingCustomer(false);
                      setSelectedCustomerId(null);
                    }}
                    onFocus={() => {
                      if (customerResults.length > 0) {
                        setShowCustomerDropdown(true);
                      }
                    }}
                    placeholder="Search customer by name, email or phone"
                    className="h-10 w-full rounded-lg border border-input px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  {searchingCustomer && (
                    <div className="mt-1 text-xs text-muted-foreground">Searching...</div>
                  )}
                  {showCustomerDropdown && customerResults.length > 0 && (
                    <div className="absolute z-50 mt-1 max-h-72 w-full overflow-auto rounded-lg border border-border bg-card shadow-lg">
                      {customerResults.map((customer) => (
                        <button
                          key={customer.id}
                          type="button"
                          onClick={() => selectCustomer(customer)}
                          className="flex w-full flex-col items-start border-b border-border px-4 py-3 text-left hover:bg-accent"
                        >
                          <span className="font-medium text-foreground">{customer.full_name}</span>
                          <span className="text-xs text-muted-foreground">{customer.email || "No email"}</span>
                          <span className="text-xs text-muted-foreground">{customer.phone || "No phone"}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Email *</label>
                  <input
                    type="text"
                    value={form.email}
                    onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                    className="h-10 w-full rounded-lg border border-input px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="Enter email"
                  />
                </div>

                {/* Phone */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Phone</label>
                  <input
                    type="text"
                    value={form.phone}
                    onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                    className="h-10 w-full rounded-lg border border-input px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="Enter phone"
                  />
                </div>
              </div>

              {/* ─── 3. Address, Complaint Source, Assigned To (3 cols) ─── */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {/* Address */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Address</label>
                  <input
                    type="text"
                    value={form.address}
                    onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
                    className="h-10 w-full rounded-lg border border-input px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="Enter address"
                  />
                </div>

                {/* Complaint Source (moved here) */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Complaint Source</label>
                  <div className="flex flex-wrap gap-2">
                    {SOURCE_OPTIONS.map(({ label, icon: Icon }) => {
                      const isSelected = form.complaintSource === label;
                      return (
                        <button
                          key={label}
                          type="button"
                          onClick={() => setForm((p) => ({ ...p, complaintSource: label }))}
                          className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition-all ${
                            isSelected
                              ? "border-primary bg-primary/10"
                              : "border-border bg-card hover:bg-accent"
                          }`}
                        >
                          <Icon className="h-3.5 w-3.5" />
                          <span>{label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                
              </div>

              {/* ─── 4. Order ID, Services Booked, Scheduled Booking Time (3 cols) ─── */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Order ID</label>
                  <input
                    type="text"
                    value={form.orderId}
                    onChange={(e) => setForm((prev) => ({ ...prev, orderId: e.target.value }))}
                    className="h-10 w-full rounded-lg border border-input px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="Enter order ID"
                  />
                </div>

                {/* Services Booked (new) */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Services Booked</label>
                  <input
                    type="text"
                    value={form.servicesBooked || ""}
                    onChange={(e) => setForm((prev) => ({ ...prev, servicesBooked: e.target.value }))}
                    className="h-10 w-full rounded-lg border border-input px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="Enter services booked"
                  />
                </div>

                {/* Scheduled Booking Time (new) */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Scheduled Booking Time</label>
                  <input
                    type="datetime-local"
                    value={form.scheduledBookingTime || ""}
                    onChange={(e) => setForm((prev) => ({ ...prev, scheduledBookingTime: e.target.value }))}
                    className="h-10 w-full rounded-lg border border-input px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              {/* ─── 5. Priority, Status (2 cols) ─── */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Priority *</label>
                  <select
                    value={form.priority}
                    onChange={(e) => setForm((prev) => ({ ...prev, priority: e.target.value }))}
                    className="h-10 w-full rounded-lg border border-input px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    {PRIORITY_OPTIONS.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Status *</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}
                    className="h-10 w-full rounded-lg border border-input px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    disabled={statusOptions.length === 0}
                  >
                    <option value="">Select status</option>
                    {statusOptions.map((status) => (
                      <option key={status.id} value={status.status_name}>
                        {status.status_name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Assigned To */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Assigned To</label>
                  <select
                    value={form.assignedToId}
                    onChange={(e) => setForm((prev) => ({ ...prev, assignedToId: e.target.value }))}
                    className="h-10 w-full rounded-lg border border-input px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="">Select staff</option>
                    {staffOptions.map((staff) => (
                      <option key={staff.id} value={String(staff.id)}>{staff.full_name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* ─── 6. Complaint Details (full width) ─── */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Complaint Details</label>
                <textarea
                  value={form.complaintDetails}
                  onChange={(e) => setForm((prev) => ({ ...prev, complaintDetails: e.target.value }))}
                  rows={4}
                  className="w-full resize-none rounded-lg border border-input px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="Enter complaint details"
                />
              </div>

              {/* ─── File Upload ─── */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">File Upload</label>
                <label
                  htmlFor="complaint-file-upload"
                  className="flex min-h-32 w-full cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-input px-4 py-6 text-center transition-colors hover:bg-muted/50"
                  style={{ backgroundColor: "#fff2dd" }}
                >
                  <UploadCloud className="h-8 w-8 text-muted-foreground" />
                  <p className="text-sm font-medium text-foreground">Attach multiple files</p>
                  <p className="text-xs text-muted-foreground">
                    .pdf, .jpg, .jpeg, .png, .webp, .gif
                  </p>
                  <input
                    id="complaint-file-upload"
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png,.webp,.gif"
                    onChange={(e) => {
                      const newFiles = Array.from(e.target.files || []);
                      setForm((p) => ({
                        ...p,
                        complaintFiles: [...p.complaintFiles, ...newFiles],
                      }));
                      e.target.value = "";
                    }}
                    className="hidden"
                  />
                </label>

                {form.complaintFiles?.length > 0 && (
                  <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
                    {form.complaintFiles.map((file, idx) => (
                      <li key={idx} className="flex items-center justify-between">
                        <span>📎 {file.name}</span>
                        <button
                          type="button"
                          onClick={() => removeFile(idx)}
                          className="text-red-500 hover:text-red-700"
                        >
                          🗑️
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {formError && <p className="text-sm text-danger">{formError}</p>}
            </form>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-4">
          <button
            type="button"
            onClick={goBack}
            className="h-10 rounded-lg border border-border bg-card px-4 text-sm font-medium text-foreground transition hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
            disabled={saving}
          >
            Cancel
          </button>
          <button
            type="submit"
            form="create-complaint-form"
            className="h-10 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={saving || statusOptions.length === 0}
          >
            {saving ? "Creating..." : "Create complaint"}
          </button>
        </div>
      </Card>
    </div>
  );
}