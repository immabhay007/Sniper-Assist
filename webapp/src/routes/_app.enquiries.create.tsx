import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { getCategoryIcon } from "@/config/categoryIcons";
import {
  ArrowLeft,
  Tag,
  Phone,
  Mail,
  Globe,
  User,
  MessageCircle,
  Circle,
  Clock,
  Calendar,
  Home,
  Ticket,
  UploadCloud,
} from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { Card } from "@/components/ui-kit/Card";
import { categoryService } from "@/services/categoryService";
import { userService } from "@/services/userService";
import { statusService, type StatusMaster } from "@/services/statusService";
import { toast } from "@/utils/toast";
import { getApiErrorMessage } from "@/utils/apiError";
import { isAxiosError } from "axios";
import api from "@/config/axios";

export const Route = createFileRoute("/_app/enquiries/create")({
  component: EnquiryCreatePage,
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
  return message; // for inline form error
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

type CategoryFull = {
  id: number;
  category_name: string;
  sla_hours: number;
  is_active: boolean;
  category_icon: string;
  color_code: string;
  created_at: string;
  updated_at: string;
};

type UserOption = {
  id: number;
  full_name: string;
};

const SOURCE_OPTIONS = [
  { label: "Phone", icon: Phone },
  { label: "Email", icon: Mail },
  { label: "Walk-in", icon: User },
];

// Map category icon names (from API) to Lucide components
const iconMap: Record<string, React.ElementType> = {
  HiOutlineTag: Tag,
  HiOutlinePhone: Phone,
  HiOutlineMail: Mail,
  HiOutlineGlobe: Globe,
  HiOutlineUser: User,
  HiOutlineChat: MessageCircle,
  HiOutlineClock: Clock,
  HiOutlineCalendar: Calendar,
  HiOutlineHome: Home,
  HiOutlineTicket: Ticket,
};

function getIconComponent(iconName: string): React.ElementType {
  return iconMap[iconName] || Circle;
}

function EnquiryCreatePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [enquiryCategories, setEnquiryCategories] = useState<CategoryFull[]>([]);
  const [userOptions, setUserOptions] = useState<UserOption[]>([]);
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
    assignedToId: "",
    enquirySource: SOURCE_OPTIONS[0].label,
    enquiryDetails: "",
    priority: "Medium",
    enquiryFiles: [] as File[],
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    status: "",
  });

  // Dynamic status maps
  const idToStatusName = Object.fromEntries(statusOptions.map((s) => [s.id, s.status_name]));
  const nameToStatusId = Object.fromEntries(statusOptions.map((s) => [s.status_name, s.id]));
  const statusNames = statusOptions.map((s) => s.status_name);

  const goBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      window.history.back();
      return;
    }
    navigate({ to: "/enquiries" });
  };

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
    const loadCategories = async () => {
      if (isFetching.current) return;
      isFetching.current = true;
      setLoading(true);
      try {
        const [categories, users, statuses] = await Promise.all([
          categoryService.listEnquiryCategories(),
          userService.list({ activeOnly: true, includeDeleted: false }),
          statusService.getStatuses(),
        ]);
        setEnquiryCategories(Array.isArray(categories) ? categories : []);
        setUserOptions(Array.isArray(users) ? users : []);
        setStatusOptions(statuses);
        if (statuses.length > 0) {
          setForm((prev) => ({
            ...prev,
            status: statuses[0].status_name,
          }));
        }
        const userId = getLoggedInUserId();
        setCreatedById(userId);
      } catch (error) {
        const msg = handleApiError(error, "Failed to load form options.");
        setStatusOptions([]);
        // Optionally set form error if needed
        setFormError(msg);
      } finally {
        setLoading(false);
        isFetching.current = false;
      }
    };
    void loadCategories();
  }, []);

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
        // Don't show toast for aborted requests or generic search errors
        if (!isAxiosError(error) || error.code !== "ERR_CANCELED") {
          // Only show error if not aborted and not 404 (404 is fine, no results)
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const now = new Date();

    // Define required fields with user‑friendly labels
    const requiredFields = [
      { key: 'customer', label: 'Customer' },
      { key: 'categoryId', label: 'Category' },
      { key: 'email', label: 'Email' },
      { key: 'priority', label: 'Priority' },
      { key: 'status', label: 'Status' },
    ];

    const missing = requiredFields.filter(
      (field) => !form[field.key as keyof typeof form]
    );

    if (missing.length) {
      setFormError(
        `Please fill all required fields: ${missing.map((f) => f.label).join(', ')}`
      );
      return;
    }

    setFormError("");
    setSaving(true);

    try {
      const statusId = nameToStatusId[form.status];
      if (!statusId) {
        throw new Error("Invalid status selected");
      }

      const formData = new FormData();

      formData.append("customer_name", form.customer);
      formData.append("email", form.email);
      formData.append("address", form.address);
      formData.append("city", form.city);
      formData.append("state", form.state);
      formData.append("phone", form.phone);
      formData.append("category_id", form.categoryId);
      formData.append("created_by", createdById);
      formData.append("is_new_customer", isExistingCustomer ? "0" : "1");
      if (selectedCustomerId) {
        formData.append("customer_id", String(selectedCustomerId));
      }
      if (form.orderId.trim()) {
        formData.append("order_id", form.orderId.trim());
      }
      if (form.assignedToId) {
        formData.append("assigned_to", form.assignedToId);
      }

      formData.append("enquiry_source", form.enquirySource);
      formData.append("enquiry_details", form.enquiryDetails || " ");
      formData.append("status_id", String(statusId));
      formData.append("priority", form.priority);
      formData.append("created_at", now.toISOString());
      formData.append("timezone_str", Intl.DateTimeFormat().resolvedOptions().timeZone);

      if (form.enquiryFiles?.length) {
        form.enquiryFiles.forEach((file) => {
          formData.append("files", file);
        });
      }

      await api.post("/enquiries/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      await queryClient.invalidateQueries({
        queryKey: ["enquiries"],
      });
      toast.success("Enquiry created successfully.");
      navigate({ to: "/enquiries" });
    } catch (error) {
      const msg = handleApiError(error, "Failed to create enquiry.");
      setFormError(msg);
    } finally {
      setSaving(false);
    }
  };

  const removeFile = (index: number) => {
    setForm((p) => ({
      ...p,
      enquiryFiles: p.enquiryFiles.filter((_, i) => i !== index),
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
            Back to Enquiry
          </button>
        </div>

        <div className="px-5 py-5">
          {loading ? (
            <div className="text-sm text-muted-foreground">
              Loading form options...
            </div>
          ) : (
            <form
              id="create-enquiry-form"
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              {/* Categories as cards (3:5 ratio) */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Category *</label>
                <div className="flex flex-wrap gap-3">
                  {enquiryCategories.map((cat) => {
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
                          aspectRatio: "5 / 5",
                        }}
                      >
                        <Icon className="h-6 w-6" style={{ color: cat.color_code }} />
                        <span
                          className="block w-full truncate px-1 leading-tight"
                          title={cat.category_name}
                        >
                          {cat.category_name}
                        </span>

                        {/* Circular badge with white tick – appears only when selected */}
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

              {/* 2. Customer, Email, Phone (same row) */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {/* Customer search */}
                <div className="space-y-1.5 relative">
                  <label className="text-sm font-medium text-foreground">
                    Customer *
                  </label>

                  <input
                    type="text"
                    value={customerSearch}
                    onChange={(e) => {
                      const value = e.target.value;
                      setCustomerSearch(value);
                      setForm((p) => ({
                        ...p,
                        customer: value,
                      }));
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
                    <div className="mt-1 text-xs text-muted-foreground">
                      Searching...
                    </div>
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
                          <span className="font-medium text-foreground">
                            {customer.full_name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {customer.email || "No email"}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {customer.phone || "No phone"}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">
                    Email *
                  </label>
                  <input
                    type="text"
                    value={form.email}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, email: e.target.value }))
                    }
                    className="h-10 w-full rounded-lg border border-input px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="Enter email"
                  />
                </div>

                {/* Phone */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">
                    Phone
                  </label>
                  <input
                    type="text"
                    value={form.phone}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, phone: e.target.value }))
                    }
                    className="h-10 w-full rounded-lg border border-input px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="Enter phone"
                  />
                </div>
              </div>

              {/* 3. Address, Order ID, Assigned To (same row) */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {/* Address */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">
                    Address
                  </label>
                  <input
                    type="text"
                    value={form.address}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, address: e.target.value }))
                    }
                    className="h-10 w-full rounded-lg border border-input px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="Enter address"
                  />
                </div>

                {/* Order ID */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">
                    Order ID
                  </label>
                  <input
                    type="text"
                    value={form.orderId}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, orderId: e.target.value }))
                    }
                    className="h-10 w-full rounded-lg border border-input px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="Enter order ID"
                  />
                </div>

                {/* Enquiry Source */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">
                    Enquiry Source
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {SOURCE_OPTIONS.map(({ label, icon: Icon }) => {
                      const isSelected = form.enquirySource === label;
                      return (
                        <button
                          key={label}
                          type="button"
                          onClick={() =>
                            setForm((p) => ({ ...p, enquirySource: label }))
                          }
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

              {/* 4. Enquiry Source (cards) + Priority + Status (same row) */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {/* Assigned To */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">
                    Assigned To
                  </label>
                  <select
                    value={form.assignedToId}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, assignedToId: e.target.value }))
                    }
                    className="h-10 w-full rounded-lg border border-input px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="">Select assignee</option>
                    {userOptions.map((user) => (
                      <option key={user.id} value={String(user.id)}>
                        {user.full_name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Priority */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">
                    Priority *
                  </label>
                  <select
                    value={form.priority}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, priority: e.target.value }))
                    }
                    className="h-10 w-full rounded-lg border border-input px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>

                {/* Status */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">
                    Status *
                  </label>
                  <select
                    value={form.status}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, status: e.target.value }))
                    }
                    className="h-10 w-full rounded-lg border border-input px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    disabled={statusOptions.length === 0}
                  >
                    {statusNames.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 5. Enquiry Details */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">
                  Enquiry Details
                </label>
                <textarea
                  value={form.enquiryDetails}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      enquiryDetails: e.target.value,
                    }))
                  }
                  rows={4}
                  className="w-full resize-none rounded-lg border border-input px-3 py-2.5 text-sm"
                  placeholder="Enter enquiry details"
                />
              </div>

              {/* ─── File Upload ─── */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">File Upload</label>

                <label
                  htmlFor="enquiry-file-upload"
                  className="flex min-h-32 w-full cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-input px-4 py-6 text-center transition-colors hover:bg-muted/50"
                  style={{ backgroundColor: "#fff2dd" }}
                >
                  <UploadCloud className="h-8 w-8 text-muted-foreground" />
                  <p className="text-sm font-medium text-foreground">Attach multiple files</p>
                  <p className="text-xs text-muted-foreground">
                    .pdf, .jpg, .jpeg, .png, .webp, .gif
                  </p>
                  <input
                    id="enquiry-file-upload"
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png,.webp,.gif"
                    onChange={(e) => {
                      const newFiles = Array.from(e.target.files || []);
                      setForm((p) => ({
                        ...p,
                        enquiryFiles: [...p.enquiryFiles, ...newFiles],
                      }));
                      e.target.value = "";
                    }}
                    className="hidden"
                  />
                </label>

                {form.enquiryFiles?.length > 0 && (
                  <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
                    {form.enquiryFiles.map((file, idx) => (
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
            className="h-10 rounded-lg border border-border bg-card px-4 text-sm font-medium"
            disabled={saving}
          >
            Cancel
          </button>

          <button
            type="submit"
            form="create-enquiry-form"
            className="h-10 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground"
            disabled={saving || statusOptions.length === 0}
          >
            {saving ? "Creating..." : "Create enquiry"}
          </button>
        </div>
      </Card>
    </div>
  );
}