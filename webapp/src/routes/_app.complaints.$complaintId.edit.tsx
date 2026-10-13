import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Phone, Mail, Globe, User, MessageCircle, UploadCloud } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Card } from "@/components/ui-kit/Card";
import api from "@/config/axios";
import { categoryService } from "@/services/categoryService";
import { userService } from "@/services/userService";
import { statusService, type StatusMaster } from "@/services/statusService";
import { toast } from "@/utils/toast";
import { getApiErrorMessage } from "@/utils/apiError";
import { isAxiosError } from "axios";
import { getCategoryIcon } from "@/config/categoryIcons";
import { formatLocalDateTime } from "@/utils/formatDate";


export const Route = createFileRoute("/_app/complaints/$complaintId/edit")({
  component: EditComplaintPage,
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
const SLA_STATUS_OPTIONS = ["On Track", "Approaching", "Breached"];


export default function EditComplaintPage() {
  const { complaintId } = Route.useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [complaintCategories, setComplaintCategories] = useState<CategoryFull[]>([]);
  const [staffOptions, setStaffOptions] = useState<StaffOption[]>([]);
  const [statusOptions, setStatusOptions] = useState<StatusMaster[]>([]);

  // Ref to prevent duplicate API calls (strict mode double mount)
  const isFetching = useRef(false);
  const previousCategoryIdRef = useRef<string>("");

  const [form, setForm] = useState({
    ticketNo: "",
    customerName: "",
    customerEmail: "",
    assignedToId: "",
    categoryId: "",
    complaintFiles: [] as File[],
    complaintSource: SOURCE_OPTIONS[0].label,
    complaintDetails: "",
    status: "",
    priority: PRIORITY_OPTIONS[1],
    slaStatus: "",
    slaDeadline: "",
  });

  const goBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      window.history.back();
      return;
    }
    navigate({ to: "/complaints" });
  };

  useEffect(() => {
    const load = async () => {
      if (isFetching.current) return;
      isFetching.current = true;
      setLoading(true);
      setError("");
      try {
        const [categories, staff, complaintRes, statuses] = await Promise.all([
          categoryService.listComplaintCategories(),
          userService.list({ activeOnly: true, includeDeleted: false }),
          api.get(`/complaints/${complaintId}`),
          statusService.getStatuses(),
        ]);

        setStatusOptions(statuses);

        const idToStatusName = Object.fromEntries(
          statuses.map((s) => [s.id, s.status_name])
        );

        setComplaintCategories(Array.isArray(categories) ? categories : []);
        setStaffOptions(Array.isArray(staff) ? staff : []);

        const complaint = complaintRes.data;
        const statusName =
          idToStatusName[Number(complaint?.status_id)] ||
          complaint?.status_name ||
          (statuses.length > 0 ? statuses[0].status_name : "");

        setForm((prev) => ({
          ...prev,
          ticketNo: complaint?.ticket_no || "",
          customerName: complaint?.customer_name || "",
          customerEmail: complaint?.email || "",
          assignedToId: complaint?.assigned_to ? String(complaint.assigned_to) : "",
          categoryId: complaint?.category_id ? String(complaint.category_id) : "",
          complaintSource: complaint?.complaint_source || SOURCE_OPTIONS[0].label,
          complaintDetails: complaint?.complaint_details || "",
          status: statusName,
          priority: complaint?.priority || PRIORITY_OPTIONS[1],
          slaStatus: complaint?.sla_status || "",
          slaDeadline: formatLocalDateTime(complaint?.sla_deadline),
        }));
        previousCategoryIdRef.current = complaint?.category_id ? String(complaint.category_id) : "";
      } catch (err) {
        const msg = handleApiError(err, "Failed to load complaint details.");
        setError(msg);
      } finally {
        setLoading(false);
        isFetching.current = false;
      }
    };
    void load();
  }, [complaintId]);

  useEffect(() => {
    // Skip if no category selected or categories not loaded
    if (!form.categoryId) return;
    if (complaintCategories.length === 0) return;
    // Skip if category hasn't actually changed
    if (form.categoryId === previousCategoryIdRef.current) return;

    const selectedCategory = complaintCategories.find(
      (cat) => String(cat.id) === form.categoryId
    );
    if (selectedCategory && selectedCategory.sla_hours) {
      const now = new Date();
      const deadline = new Date(now.getTime() + selectedCategory.sla_hours * 60 * 60 * 1000);
      setForm((prev) => ({
        ...prev,
        slaDeadline: formatLocalDateTime(deadline),
      }));
    }

    // Update the ref to the new category
    previousCategoryIdRef.current = form.categoryId;
  }, [form.categoryId, complaintCategories]);

  function parseCustomDateToISO(dateStr: string): string | null {
    if (!dateStr) return null;
    // Match: day, month, year, hour, minute, am/pm
    const regex = /^(\d{1,2})\s+(\w+)\s+(\d{4}),\s+(\d{1,2}):(\d{2})\s+(AM|PM)$/;
    const match = dateStr.match(regex);
    if (!match) {
      // Fallback: try native parsing
      const d = new Date(dateStr);
      return isNaN(d.getTime()) ? null : d.toISOString();
    }
    const [, day, month, year, hour, minute, ampm] = match;
    const months: Record<string, number> = {
      January: 0, February: 1, March: 2, April: 3, May: 4, June: 5,
      July: 6, August: 7, September: 8, October: 9, November: 10, December: 11
    };
    const monthIndex = months[month];
    if (monthIndex === undefined) return null;
    let h = parseInt(hour, 10);
    const m = parseInt(minute, 10);
    if (ampm === 'PM' && h !== 12) h += 12;
    if (ampm === 'AM' && h === 12) h = 0;
    const dateObj = new Date(parseInt(year, 10), monthIndex, parseInt(day, 10), h, m);
    return isNaN(dateObj.getTime()) ? null : dateObj.toISOString();
  }


  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Required fields for Complaint Edit
    const requiredFields = [
      { key: 'categoryId', label: 'Category' },
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
      const nameToStatusId = Object.fromEntries(
        statusOptions.map((s) => [s.status_name, s.id])
      );
      const statusId = nameToStatusId[form.status];
      if (!statusId) {
        throw new Error("Invalid status selected");
      }

      const now = new Date();
      const formData = new FormData();
      formData.append("assigned_to", String(Number(form.assignedToId)));
      formData.append("category_id", String(Number(form.categoryId)));
      formData.append("complaint_source", form.complaintSource);
      formData.append("complaint_details", form.complaintDetails);
      formData.append("status_id", String(statusId));
      formData.append("priority", form.priority);
      formData.append("sla_status", form.slaStatus);
      formData.append("timezone_str", Intl.DateTimeFormat().resolvedOptions().timeZone);
      formData.append("created_at", now.toISOString());

      const slaDeadlineISO = parseCustomDateToISO(form.slaDeadline);
      if (slaDeadlineISO) {
        formData.append("sla_deadline", slaDeadlineISO);
      }

      form.complaintFiles.forEach((file) => {
        formData.append("files", file);
      });

      await api.put(`/complaints/${complaintId}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("Complaint updated successfully.");
      navigate({ to: "/complaints" });
    } catch (err) {
      const msg = handleApiError(err, "Failed to update complaint.");
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
        <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
          <div className="flex items-start gap-3">
            <button
              type="button"
              onClick={goBack}
              className="mt-0.5 flex h-9 items-center gap-2 rounded-lg border border-border bg-card px-3 text-sm font-medium text-foreground transition hover:bg-accent"
              aria-label="Back"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Complaint
            </button>
          </div>

          <div className="rounded-md border border-border bg-muted/30 px-3 py-2 text-xs">
            <div>
              <span className="font-medium">Ticket No:</span> {form.ticketNo}
            </div>
            <div>
              <span className="font-medium">Customer:</span> {form.customerName}
            </div>
            <div>
              <span className="font-medium">Email:</span> {form.customerEmail}
            </div>
          </div>
        </div>

        <div className="px-5 py-5">
          {loading ? (
            <div className="text-sm text-muted-foreground">Loading complaint details...</div>
          ) : error ? (
            <div className="text-sm text-danger">{error}</div>
          ) : (
            <form id="edit-complaint-form" onSubmit={handleSubmit} className="space-y-4">
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

              {/* ─── 2. Assigned To, Complaint Source (cards), Status (3 cols) ─── */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Assigned To *</label>
                  <select
                    value={form.assignedToId}
                    onChange={(e) => setForm((prev) => ({ ...prev, assignedToId: e.target.value }))}
                    className="h-10 w-full rounded-lg border border-input px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="">Select staff</option>
                    {staffOptions.map((staff) => (
                      <option key={staff.id} value={String(staff.id)}>
                        {staff.full_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Complaint Source *</label>
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
              </div>

              {/* ─── 3. Priority, SLA Status, SLA Deadline (3 cols) ─── */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Priority *</label>
                  <select
                    value={form.priority}
                    onChange={(e) => setForm((prev) => ({ ...prev, priority: e.target.value }))}
                    className="h-10 w-full rounded-lg border border-input px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    {PRIORITY_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">SLA Status *</label>
                  <select
                    value={form.slaStatus}
                    disabled
                    onChange={(e) => setForm((prev) => ({ ...prev, slaStatus: e.target.value }))}
                    className="h-10 w-full rounded-lg border border-input px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">Select SLA status</option>
                    {SLA_STATUS_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col space-y-1.5">
                  <label className="text-sm font-medium text-foreground">
                    SLA Deadline{" "}
                    <span className="text-xs text-muted-foreground font-normal">
                      (auto-calculated based on SLA hours if not provided)
                    </span>
                  </label>
                  <DatePicker
                    selected={form.slaDeadline ? new Date(form.slaDeadline) : null}
                    onChange={(date: Date | null) =>
                      setForm((prev) => ({
                        ...prev,
                        slaDeadline: date ? date.toISOString() : "",
                      }))
                    }
                    showTimeSelect
                    timeIntervals={15}
                    dateFormat="MMM d, yyyy h:mm aa"
                    className="h-10 w-full rounded-lg border border-input px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              {/* ─── 4. Complaint Details (full width) ─── */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Complaint Details *</label>
                <textarea
                  value={form.complaintDetails}
                  onChange={(e) => setForm((prev) => ({ ...prev, complaintDetails: e.target.value }))}
                  rows={4}
                  className="w-full resize-none rounded-lg border border-input px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
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
                    {".pdf, .jpg, .jpeg, .png, .webp, .gif"}
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
            className="h-10 rounded-lg border border-border bg-card px-4 text-sm font-medium text-foreground transition hover:bg-accent"
            disabled={saving}
          >
            Cancel
          </button>
          <button
            type="submit"
            form="edit-complaint-form"
            disabled={loading || saving || statusOptions.length === 0}
            className="h-10 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Updating..." : "Update complaint"}
          </button>
        </div>
      </Card>
    </div>
  );
}