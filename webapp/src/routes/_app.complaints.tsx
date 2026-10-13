import { createFileRoute, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useMemo, useState, useRef } from "react";
import { Card, CardHeader } from "@/components/ui-kit/Card";
import { CaseIntakeForm, type CaseIntakeValues } from "@/components/forms/CaseIntakeForm";
import { complaintService } from "@/services/complaintService";
import { categoryService } from "@/services/categoryService";
import { userService } from "@/services/userService";
import { statusService, type StatusMaster } from "@/services/statusService";
import { toast } from "@/utils/toast";
import { formatLocalDateTime } from "@/utils/formatDate";
import { useFloating, autoUpdate, offset, flip, shift } from '@floating-ui/react';
import { calculateSlaStatus } from "@/utils/slaUtils";
import { usePageSearch } from "@/context/PageSearchContext";
import {
  AlertOctagon,
  ArrowLeft,
  Plus,
  X,
  MoreVertical,
  Pencil,
  Trash2,
  StickyNote,
  Paperclip,
  Eye,
  Download,
  Minus,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { NotesDrawer } from "@/components/common/NoteDrawer";
import api from "@/config/axios";
import { isAxiosError } from "axios";

export const Route = createFileRoute("/_app/complaints")({
  component: ComplaintsPage,
});

type Attachment = {
  file_name: string;
  file_type: string;
  base64_data: string;
};

type ComplaintRow = {
  id: number;
  ticket_no: string;
  customer_name: string;
  category_name: string;
  created_by_name: string;
  assigned_to: number | null;
  assigned_to_name: string | null;
  status_id: number;
  status_name: string;
  sla_status: string;
  sla_deadline: string;
  complaint_details: string | null;
  created_at: string;
  attachments: Attachment[];
  next_action_item: string;
};

type CategoryOption = {
  id: number;
  category_name: string;
};

type StaffOption = {
  id: number;
  full_name: string;
  role_name?: string;
};

type EditComplaintForm = {
  assignedToId: string;
  categoryId: string;
  complaintSource: string;
  complaintDetails: string;
  status: string;
  priority: string;
  slaStatus: string;
  slaDeadline: string;
};

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

type UserOption = {
  id: number;
  full_name: string;
};

const MONTH_OPTIONS = ["All", ...MONTHS] as const;

const SOURCE_OPTIONS = ["Phone", "Email", "Web", "Walk-in", "WhatsApp"];
const PRIORITY_OPTIONS = ["Low", "Medium", "High", "Urgent"];
const SLA_STATUS_OPTIONS = ["", "On Track", "At Risk", "Breached"];

const emptyEditForm: EditComplaintForm = {
  assignedToId: "",
  categoryId: "",
  complaintSource: SOURCE_OPTIONS[0],
  complaintDetails: "",
  status: "",
  priority: PRIORITY_OPTIONS[1],
  slaStatus: "",
  slaDeadline: "",
};

// Unified error handler for API calls
const handleApiError = (error: unknown, defaultMessage: string) => {
  if (isAxiosError(error) && error.response?.status === 403) {
    const detail = (error.response.data as { detail?: string })?.detail || "You don't have permission to perform this action.";
    toast.error(detail);
  } else {
    toast.error(defaultMessage);
  }
};

function toDateTimeLocal(value?: string | null) {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  const local = new Date(parsed.getTime() - parsed.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

function formatDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getDateRange(monthName: string, yearValue: number) {
  if (!Number.isFinite(yearValue)) return null;

  if (monthName === "All") {
    return {
      fromDate: formatDate(new Date(yearValue, 0, 1)),
      toDate: formatDate(new Date(yearValue, 11, 31)),
    };
  }

  const monthIndex = MONTHS.indexOf(monthName);
  if (monthIndex < 0) return null;

  return {
    fromDate: formatDate(new Date(yearValue, monthIndex, 1)),
    toDate: formatDate(new Date(yearValue, monthIndex + 1, 0)),
  };
}

function ComplaintsPage() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const now = new Date();
  const [month, setMonth] = useState<string>(MONTHS[now.getMonth()]);
  const [year, setYear] = useState<number>(now.getFullYear());
  const [rows, setRows] = useState<ComplaintRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [isNewOpen, setIsNewOpen] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [deleteSaving, setDeleteSaving] = useState(false);
  const [editForm, setEditForm] = useState<EditComplaintForm>(emptyEditForm);
  const [editFormError, setEditFormError] = useState("");
  const [complaintCategories, setComplaintCategories] = useState<CategoryOption[]>([]);
  const [staffOptions, setStaffOptions] = useState<StaffOption[]>([]);
  const [statusOptions, setStatusOptions] = useState<StatusMaster[]>([]);
  const [userOptions, setUserOptions] = useState<UserOption[]>([]);
  const yearOptions = useMemo(
    () => [now.getFullYear() - 2, now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1],
    [now],
  );
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<ComplaintRow | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const { query, setQuery, setResultCount } = usePageSearch();
  const [categoryFilter, setCategoryFilter] = useState<string>("All");
  const [assignedToFilter, setAssignedToFilter] = useState<string>("All");
  const [createdByFilter, setCreatedByFilter] = useState<string>("All");
  const [slaStatusFilter, setSlaStatusFilter] = useState<string>("All");
  const [statusFilter, setStatusFilter] = useState<string>("All");

  // Preview state
  const [previewAttachments, setPreviewAttachments] = useState<Attachment[]>([]);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [zoom, setZoom] = useState(100);

  // Dynamic status maps (from all statuses)
  const idToStatusName = useMemo(() => {
    return Object.fromEntries(statusOptions.map((s) => [s.id, s.status_name]));
  }, [statusOptions]);

  const getComputedSlaStatus = (row: ComplaintRow) =>
    calculateSlaStatus(row.sla_deadline, row.created_at);
  
  const nameToStatusId = useMemo(() => {
    return Object.fromEntries(statusOptions.map((s) => [s.status_name, s.id]));
  }, [statusOptions]);

  useEffect(() => {
    setSearchTerm(query);
  }, [query]);

  const statusNames = useMemo(() => {
    return statusOptions.map((s) => s.status_name);
  }, [statusOptions]);

  const categoryOptions = useMemo(() => {
      const names = rows.map(r => r.category_name).filter(Boolean);
      return ["All", ...Array.from(new Set(names))];
    }, [rows]);

  const { x, y, strategy, refs, update } = useFloating({
    placement: 'bottom-end',
    middleware: [offset(8), flip(), shift()],
    whileElementsMounted: autoUpdate,
  });

  useEffect(() => {
    if (openMenuId !== null) {
      update();
    }
  }, [openMenuId, update]);

  const filteredRows = useMemo(() => {
    return rows.filter(row => {
      if (categoryFilter !== "All" && row.category_name !== categoryFilter) return false;
      if (assignedToFilter !== "All" && row.assigned_to_name !== assignedToFilter) return false;
      if (createdByFilter !== "All" && row.created_by_name !== createdByFilter) return false;
      if (slaStatusFilter !== "All" && getComputedSlaStatus(row) !== slaStatusFilter) return false;
      if (statusFilter !== "All" && row.status_name !== statusFilter) return false;

      if (searchTerm.trim() !== "") {
        const term = searchTerm.trim().toLowerCase();
        return (
          row.ticket_no?.toLowerCase().includes(term) ||
          row.customer_name?.toLowerCase().includes(term) ||
          row.category_name?.toLowerCase().includes(term) ||
          row.assigned_to_name?.toLowerCase().includes(term) ||
          row.created_by_name?.toLowerCase().includes(term) ||
          row.status_name?.toLowerCase().includes(term) ||
          row.complaint_details?.toLowerCase().includes(term)
        );
      }
      return true;
    });
  }, [rows, categoryFilter, assignedToFilter, createdByFilter, slaStatusFilter, statusFilter, searchTerm]);

  useEffect(() => {
    setResultCount(filteredRows.length);
  }, [filteredRows, setResultCount]);

  const assignedToOptions = useMemo(() => {
    const names = rows.map(r => r.assigned_to_name).filter(Boolean);
    return ["All", ...Array.from(new Set(names))];
  }, [rows]);

  const createdByOptions = useMemo(() => {
    const names = rows.map(r => r.created_by_name).filter(Boolean);
    return ["All", ...Array.from(new Set(names))];
  }, [rows]);

  const slaStatusOptions = useMemo(() => {
    const computedStatuses = rows.map((r) => getComputedSlaStatus(r)).filter(Boolean);
    return ["All", ...Array.from(new Set(computedStatuses))];
  }, [rows]);

  const drawerStatusOptions = useMemo(() => 
    statusOptions.map((s) => ({ id: s.id, status_name: s.status_name })),
    [statusOptions]
  );

  const statusFilterOptions = useMemo(() => {
    const names = rows.map(r => r.status_name).filter(Boolean);
    return ["All", ...Array.from(new Set(names))];
  }, [rows]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const range = getDateRange(month, year);
        const data = await complaintService.getComplaints({
          customerId: 0,
          fromDate: range?.fromDate,
          toDate: range?.toDate,
        });
        setRows(Array.isArray(data) ? (data as ComplaintRow[]) : []);
      } catch (err) {
        console.error("Complaint load error:", err);
        if (isAxiosError(err) && err.response?.status === 403) {
          const detail = (err.response.data as { detail?: string })?.detail || "You don't have permission to view complaints.";
          toast.error(detail);
          setError(detail);
        } else {
          setError("Failed to load complaints.");
          toast.error("Failed to load complaints.");
        }
        setRows([]);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [month, year]);

  useEffect(() => {
    const loadDropdowns = async () => {
      try {
        const [categories, statuses, users] = await Promise.all([
          categoryService.listComplaintCategories(),
          statusService.getStatuses(),
          userService.list({ activeOnly: true, includeDeleted: false }),
        ]);
        setComplaintCategories(Array.isArray(categories) ? (categories as CategoryOption[]) : []);
        setStatusOptions(statuses);
        setUserOptions(Array.isArray(users) ? users : []);
        
        // ✅ Set staffOptions to ALL users (so any assigned user is in the dropdown)
        setStaffOptions(Array.isArray(users) ? users : []);
      } catch (err) {
        // Silent fail for this background load, but show toast for 403
        if (isAxiosError(err) && err.response?.status === 403) {
          const detail = (err.response.data as { detail?: string })?.detail || "You don't have permission to access some resources.";
          toast.error(detail);
        }
        setComplaintCategories([]);
        setStaffOptions([]);
        setStatusOptions([]);
      }
    };
    void loadDropdowns();
  }, []);

  const refetchComplaints = async () => {
    const range = getDateRange(month, year);
    try {
      const data = await complaintService.getComplaints({
        customerId: 0,
        fromDate: range?.fromDate,
        toDate: range?.toDate,
      });
      setRows(Array.isArray(data) ? (data as ComplaintRow[]) : []);
    } catch (err) {
      handleApiError(err, "Failed to refresh complaints.");
      setRows([]);
    }
  };

  const isFirstPathRef = useRef(true);

  useEffect(() => {
    if (pathname === "/complaints") {
      if (isFirstPathRef.current) {
        isFirstPathRef.current = false;
        return;
      }
      refetchComplaints();
    }
  }, [pathname]);

  const handleAssignedChange = async (rowId: number, newAssignedToId: number | null) => {
      const currentRow = rows.find((r) => r.id === rowId);
      const oldAssignedTo = currentRow?.assigned_to ?? null;
      const oldAssignedToName = currentRow?.assigned_to_name ?? null;
  
      // Optimistic update
      setRows((prevRows) =>
        prevRows.map((row) =>
          row.id === rowId
            ? {
                ...row,
                assigned_to: newAssignedToId,
                assigned_to_name:
                  staffOptions.find((s) => s.id === newAssignedToId)?.full_name || null,
              }
            : row
        )
      );
  
      try {
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const now = new Date().toISOString();
  
        // Use URLSearchParams for application/x-www-form-urlencoded
        const params = new URLSearchParams();
        if (newAssignedToId !== null) {
          params.append("assigned_to", String(newAssignedToId));
        }
        // ✅ Correct field name: "timezone_str"
        params.append("timezone_str", timezone);
        params.append("updated_at", now);
  
        await api.put(`/complaints/${rowId}/assigned-ticket`, params.toString(), {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        });
        toast.success("Ticket assigned.");
      } catch (error) {
        // Rollback on error
        setRows((prevRows) =>
          prevRows.map((row) =>
            row.id === rowId
              ? { ...row, assigned_to: oldAssignedTo, assigned_to_name: oldAssignedToName }
              : row
          )
        );
        handleApiError(error, "Failed to update assigned user.");
      }
    };

  const handleCreate = async (values: CaseIntakeValues) => {
    try {
      const formData = new FormData();
      formData.append("customer_name", values.customerId);
      formData.append("category_id", values.categoryId);
      formData.append("created_by", values.createdById);
      if (values.assignedToId) formData.append("assigned_to", values.assignedToId);
      if (values.orderId.trim()) formData.append("order_id", values.orderId.trim());
      formData.append("complaint_source", values.source);
      if (values.scheduleBookingTime) formData.append("schedule_booking_time", values.scheduleBookingTime);
      formData.append("services_booked", "null");
      formData.append("complaint_details", values.details);
      const statusId = nameToStatusId[values.status];
      formData.append("status_id", String(statusId || (statusOptions.length > 0 ? statusOptions[0].id : 1)));
      formData.append("priority", values.priority);
      if (values.slaDeadline) formData.append("sla_deadline", values.slaDeadline);
      if (values.slaStatus) formData.append("sla_status", values.slaStatus);
      if (values.firstResponseAt) formData.append("first_response_at", values.firstResponseAt);
      if (values.resolvedAt) formData.append("resolved_at", values.resolvedAt);
      if (values.closedAt) formData.append("closed_at", values.closedAt);

      values.files.forEach((file) => {
        formData.append("files", file);
      });

      await api.post("/complaints/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setIsNewOpen(false);
      await refetchComplaints();
      toast.success("Complaint created successfully.");
    } catch (err) {
      console.error("Failed to create complaint:", err);
      if (isAxiosError(err) && err.response?.status === 403) {
        const detail = (err.response.data as { detail?: string })?.detail || "You don't have permission to create complaints.";
        toast.error(detail);
      } else if (isAxiosError(err) && err.response?.data) {
        const detail = Array.isArray((err.response.data as { detail?: unknown }).detail)
          ? ((err.response.data as { detail: Array<{ msg?: string }> }).detail[0]?.msg || "Failed to create complaint.")
          : "Failed to create complaint.";
        toast.error(detail);
      } else {
        toast.error("Failed to create complaint.");
      }
    }
  };

  const openEditModal = async (id: number) => {
    setOpenMenuId(null);
    setEditingId(id);
    setIsEditOpen(true);
    setEditForm(emptyEditForm);
    setEditFormError("");
    setEditLoading(true);

    try {
      const { data } = await api.get(`/complaints/${id}`);

      setEditForm({
        assignedToId: data?.assigned_to ? String(data.assigned_to) : "",
        categoryId: data?.category_id ? String(data.category_id) : "",
        complaintSource: data?.complaint_source || SOURCE_OPTIONS[0],
        complaintDetails: data?.complaint_details || "",
        status: data?.status_name || idToStatusName[Number(data?.status_id)] || (statusNames.length > 0 ? statusNames[0] : ""),
        priority: data?.priority || PRIORITY_OPTIONS[1],
        slaStatus: data?.sla_status || "",
        slaDeadline: toDateTimeLocal(data?.sla_deadline),
      });
    } catch (err) {
      console.error("Failed to load complaint:", err);
      handleApiError(err, "Failed to load complaint details.");
    } finally {
      setEditLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingId) return;

    if (!editForm.assignedToId || !editForm.categoryId || !editForm.complaintSource || !editForm.complaintDetails || !editForm.status || !editForm.priority || !editForm.slaStatus || !editForm.slaDeadline) {
      setEditFormError("Please fill all required fields.");
      return;
    }

    setEditFormError("");
    setEditSaving(true);
    try {
      const statusId = nameToStatusId[editForm.status] ?? (statusOptions.length > 0 ? statusOptions[0].id : 1);
      await api.put(`/complaints/${editingId}`, {
        assigned_to: Number(editForm.assignedToId),
        category_id: Number(editForm.categoryId),
        complaint_source: editForm.complaintSource,
        complaint_details: editForm.complaintDetails,
        status_id: statusId,
        priority: editForm.priority,
        sla_status: editForm.slaStatus,
        sla_deadline: new Date(editForm.slaDeadline).toISOString(),
      });

      setIsEditOpen(false);
      setEditingId(null);
      await refetchComplaints();
      toast.success("Complaint updated successfully.");
    } catch (err) {
      if (isAxiosError(err) && err.response?.status === 403) {
        const detail = (err.response.data as { detail?: string })?.detail || "You don't have permission to update complaints.";
        setEditFormError(detail);
        toast.error(detail);
      } else if (isAxiosError(err) && err.response?.data) {
        const detail = Array.isArray((err.response.data as { detail?: unknown }).detail)
          ? ((err.response.data as { detail: Array<{ msg?: string }> }).detail[0]?.msg || "Failed to update complaint.")
          : "Failed to update complaint.";
        setEditFormError(detail);
        toast.error(detail);
      } else {
        setEditFormError("Failed to update complaint.");
        toast.error("Failed to update complaint.");
      }
    } finally {
      setEditSaving(false);
    }
  };

  const openDeleteModal = (id: number) => {
    setOpenMenuId(null);
    setDeleteTargetId(id);
    setIsDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTargetId) return;
    setDeleteSaving(true);

    try {
      await api.delete(`/complaints/${deleteTargetId}`);
      await refetchComplaints();
      setIsDeleteOpen(false);
      setDeleteTargetId(null);
      toast.success("Complaint deleted successfully.");
    } catch (err) {
      handleApiError(err, "Failed to delete complaint.");
    } finally {
      setDeleteSaving(false);
    }
  };

  const openPreview = (attachments: Attachment[]) => {
    if (!attachments || attachments.length === 0) return;
    setPreviewAttachments(attachments);
    setPreviewIndex(0);
    setZoom(100);
    setIsPreviewOpen(true);
  };

  const closePreview = () => {
    setIsPreviewOpen(false);
    setPreviewAttachments([]);
    setPreviewIndex(0);
    setZoom(100);
  };

  const nextAttachment = () => {
    setPreviewIndex((prev) => (prev + 1) % previewAttachments.length);
    setZoom(100);
  };

  const prevAttachment = () => {
    setPreviewIndex((prev) => (prev - 1 + previewAttachments.length) % previewAttachments.length);
    setZoom(100);
  };

  const handleZoomIn = () => {
    setZoom((z) => Math.min(200, z + 10));
  };

  const handleZoomOut = () => {
    setZoom((z) => Math.max(25, z - 10));
  };

  const handleDownload = () => {
    const file = previewAttachments[previewIndex];
    if (!file) return;
    const link = document.createElement("a");
    link.href = `data:${file.file_type};base64,${file.base64_data}`;
    link.download = file.file_name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (pathname !== "/complaints") {
    return <Outlet />;
  }


  const getSlaBadge = (status?: string | null) => {
    switch (status) {
      case "Breached":
        return (
          <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700">
            Breached
          </span>
        );
      case "Approaching":
        return (
          <span className="inline-flex items-center rounded-full bg-orange-100 px-2.5 py-1 text-xs font-medium text-orange-700">
            Approaching
          </span>
        );
      case "On Track":
        return (
          <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700">
            On Track
          </span>
        );
      default:
        return "-";
    }
  };

  const handleStatusChange = async (rowId: number, newStatus: string) => {
    const currentRow = rows.find((r) => r.id === rowId);
    const oldStatus = currentRow?.status_name || (statusNames.length > 0 ? statusNames[0] : "");

    setRows((prevRows) =>
      prevRows.map((row) =>
        row.id === rowId ? { ...row, status_name: newStatus } : row
      )
    );

    try {
      const statusId = nameToStatusId[newStatus];
      if (statusId === undefined) {
        throw new Error(`Invalid status: ${newStatus}`);
      }

      const now = new Date();
      const formData = new FormData();
      formData.append("updated_at", now.toISOString());
      formData.append("timezone_str", Intl.DateTimeFormat().resolvedOptions().timeZone);

      await api.put(`/complaints/${rowId}/status?status_id=${statusId}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("Status updated successfully.");
    } catch (error) {
      setRows((prevRows) =>
        prevRows.map((row) =>
          row.id === rowId ? { ...row, status_name: oldStatus } : row
        )
      );
      if (isAxiosError(error) && error.response?.status === 403) {
        const detail = (error.response.data as { detail?: string })?.detail || "You don't have permission to change status.";
        toast.error(detail);
      } else if (isAxiosError(error) && error.response?.data) {
        const detail = (error.response.data as { detail?: string })?.detail || "Failed to update status.";
        toast.error(detail);
      } else {
        toast.error("Failed to update status.");
      }
    }
  };

  function getStatusBadgeClasses(status: string): string {
    switch (status) {
      case "Open":
        return "bg-green-100 text-green-700 hover:bg-green-200";
      case "In Progress":
        return "bg-blue-100 text-blue-700 hover:bg-blue-200";
      case "Pending":
        return "bg-yellow-100 text-yellow-700 hover:bg-yellow-200";
      case "Resolved":
        return "bg-purple-100 text-purple-700 hover:bg-purple-200";
      case "Closed":
        return "bg-gray-100 text-gray-700 hover:bg-gray-200";
      default:
        return "bg-gray-100 text-gray-700";
    }
  }

  return (
    <>
      <Card>
        <CardHeader
          icon={<AlertOctagon className="h-4 w-4" />}
          title="All complaints"
          action={
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{filteredRows.length} results</span>
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => {
                  const val = e.target.value;
                  setSearchTerm(val);
                  setQuery(val); // update global header search
                }}
                className="h-9 w-48 rounded-lg border border-input bg-background px-3 py-1 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <button
                type="button"
                onClick={() => navigate({ to: "/complaints/create" })}
                className="flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90"
              >
                <Plus className="h-4 w-4" /> New
              </button>
            </div>
          }
        />

        <div className="flex flex-wrap items-center gap-2 px-5 pb-4">
          {/* Month filter - keep "All" */}
          <select
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="h-9 rounded-lg border border-input bg-card px-3 text-sm"
          >
            {MONTH_OPTIONS.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
          {/* Year filter - keep "All" (yearOptions are numbers only, but we can add "All" if needed) */}
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="h-9 rounded-lg border border-input bg-card px-3 text-sm"
          >
            {yearOptions.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>

          {/* Category filter - replace "All" label with "Category" */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-9 rounded-lg border border-input bg-card px-3 text-sm"
          >
            {categoryOptions.map(opt => (
              <option key={opt} value={opt}>
                {opt === "All" ? "Category" : opt}
              </option>
            ))}
          </select>

          {/* Assigned To filter - replace "All" label with "Assigned To" */}
          <select
            value={assignedToFilter}
            onChange={(e) => setAssignedToFilter(e.target.value)}
            className="h-9 rounded-lg border border-input bg-card px-3 text-sm"
          >
            {assignedToOptions.map(opt => (
              <option key={opt} value={opt}>
                {opt === "All" ? "Assigned To" : opt}
              </option>
            ))}
          </select>

          {/* Created By filter - replace "All" label with "Created By" */}
          <select
            value={createdByFilter}
            onChange={(e) => setCreatedByFilter(e.target.value)}
            className="h-9 rounded-lg border border-input bg-card px-3 text-sm"
          >
            {createdByOptions.map(opt => (
              <option key={opt} value={opt}>
                {opt === "All" ? "Created By" : opt}
              </option>
            ))}
          </select>

          {/* SLA Status filter - replace "All" label with "SLA Status" */}
          <select
            value={slaStatusFilter}
            onChange={(e) => setSlaStatusFilter(e.target.value)}
            className="h-9 rounded-lg border border-input bg-card px-3 text-sm"
          >
            {slaStatusOptions.map(opt => (
              <option key={opt} value={opt}>
                {opt === "All" ? "SLA Status" : opt}
              </option>
            ))}
          </select>

          {/* Status filter - replace "All" label with "Status" */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 rounded-lg border border-input bg-card px-3 text-sm"
          >
            {statusFilterOptions.map(opt => (
              <option key={opt} value={opt}>
                {opt === "All" ? "Status" : opt}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="px-5 pb-6 text-sm text-muted-foreground">Loading complaints...</div>
        ) : error ? (
          <div className="px-5 pb-6 text-sm text-danger">{error}</div>
        ) : rows.length === 0 ? (
          <div className="px-5 pb-6 text-sm text-muted-foreground">No complaints found.</div>
        ) : filteredRows.length === 0 ? (
          <div className="px-5 pb-6 text-sm text-muted-foreground">No complaints match the selected filters.</div>
        ) : (
          <div className="overflow-x-auto px-2 pb-3">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-3 py-2 font-semibold">Ticket ID</th>
                  <th className="px-3 py-2 font-semibold">Category</th>
                  <th className="px-3 py-2 font-semibold">Customer</th>
                  <th className="px-3 py-2 font-semibold">Assigned To</th>
                  <th className="px-3 py-2 font-semibold">Created By</th>
                  <th className="px-3 py-2 font-semibold">Created At</th>
                  <th className="px-3 py-2 font-semibold">SLA Status</th>
                  <th className="px-3 py-2 font-semibold">SLA Deadline</th>
                  <th className="px-3 py-2 font-semibold">Description</th>
                  <th className="px-3 py-2 font-semibold">Attachments</th>
                  <th className="px-3 py-2 font-semibold">Status</th>
                  <th className="px-3 py-2 text-center font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row) => (
                  <tr key={row.id} className="border-t border-border hover:bg-accent/50">
                    <td className="px-3 py-3 font-medium">
                      <button
                        type="button"
                        onClick={() =>
                          navigate({
                            to: "/tickets/$id",
                            params: { id: row.ticket_no },
                          })
                        }
                        className="text-primary hover:underline cursor-pointer"
                      >
                        {row.ticket_no}
                      </button>
                    </td>
                    <td className="px-3 py-3">{row.category_name || "-"}</td>
                    <td className="px-3 py-3">{row.customer_name || "-"}</td>
                    <td className="px-3 py-3 min-w-[160px]">
                      <select
                        value={row.assigned_to ?? ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          handleAssignedChange(row.id, val ? Number(val) : null);
                        }}
                        className="w-full rounded-lg border border-input bg-background px-2 py-1 text-xs focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      >
                        <option value="">Unassigned</option>
                        {staffOptions.map((staff) => (
                          <option key={staff.id} value={staff.id}>
                            {staff.full_name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-3">{row.created_by_name || "-"}</td>
                    <td className="px-3 py-3">{formatLocalDateTime(row.created_at) || "-"}</td>
                    <td className="px-3 py-3">
                      {getSlaBadge(calculateSlaStatus(row.sla_deadline, row.created_at))}
                    </td>
                    <td className="px-3 py-3">{formatLocalDateTime(row.sla_deadline) || "-"}</td>
                    <td className="px-3 py-3">{row.complaint_details || "-"}</td>
                    <td className="px-3 py-3">
                      {row.attachments && row.attachments.length > 0 ? (
                        <button
                          type="button"
                          onClick={() => openPreview(row.attachments)}
                          className="flex items-center gap-2 rounded px-2 py-1 text-primary transition hover:bg-primary/10 focus:outline-none focus:ring-2 focus:ring-primary/20"
                        >
                          <Paperclip className="h-4 w-4" />
                          <span className="text-xs font-medium">{row.attachments.length}</span>
                          <Eye className="h-4 w-4" />
                        </button>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <select
                        value={row.status_name || (statusNames.length > 0 ? statusNames[0] : "")}
                        onChange={(e) => handleStatusChange(row.id, e.target.value)}
                        className={`px-3 py-1 text-xs font-medium rounded-full border-0 cursor-pointer ${getStatusBadgeClasses(row.status_name || (statusNames.length > 0 ? statusNames[0] : ""))}`}
                        style={{ backgroundImage: "none" }}
                        disabled={statusOptions.length === 0}
                      >
                        {statusNames.map((name) => (
                          <option key={name} value={name}>{name}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex justify-center">
                        <button
                          type="button"
                          onClick={(e) => {
                            const btn = e.currentTarget;
                            refs.setReference(btn);
                            setOpenMenuId(openMenuId === row.id ? null : row.id);
                          }}
                          className="rounded-lg p-2 transition hover:bg-accent"
                        >
                          <MoreVertical className="h-4 w-4 text-muted-foreground" />
                        </button>

                        {openMenuId === row.id && (
                          <div
                            ref={refs.setFloating}
                            style={{
                              position: strategy,
                              top: y ?? 0,
                              left: x ?? 0,
                              zIndex: 50,
                            }}
                            className="min-w-[140px] rounded-lg border border-border bg-card shadow-lg"
                          >
                            <button
                              type="button"
                              className="flex w-full items-center gap-2 px-3 py-2 text-sm transition hover:bg-accent"
                              onClick={() => {
                                setOpenMenuId(null);
                                setSelectedComplaint(row);
                                setDrawerOpen(true);
                              }}
                            >
                              <StickyNote className="h-4 w-4" />
                              View Note
                            </button>
                            <button
                              type="button"
                              className="flex w-full items-center gap-2 px-3 py-2 text-sm transition hover:bg-accent"
                              onClick={() => {
                                setOpenMenuId(null);
                                navigate({
                                  to: "/complaints/$complaintId/edit",
                                  params: { complaintId: String(row.id) },
                                });
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                              Edit
                            </button>
                            <button
                              type="button"
                              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-500 transition hover:bg-accent"
                              onClick={() => {
                                setOpenMenuId(null);
                                openDeleteModal(row.id);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* New Complaint Modal */}
      {isNewOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-background/70 p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-4xl animate-in fade-in zoom-in-95 duration-200">
            <Card>
              <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    onClick={() => setIsNewOpen(false)}
                    className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition hover:bg-accent"
                    aria-label="Back"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                  <div>
                    <h2 className="font-display text-lg font-semibold text-foreground">New complaint</h2>
                    <p className="text-sm text-muted-foreground">Capture a new complaint ticket</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsNewOpen(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-accent"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="px-5 py-5">
                <CaseIntakeForm formId="new-complaint-form" kind="complaint" onSubmit={handleCreate} />
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-4">
                <button
                  type="button"
                  onClick={() => setIsNewOpen(false)}
                  className="h-10 rounded-lg border border-border bg-card px-4 text-sm font-medium text-foreground transition hover:bg-accent"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="new-complaint-form"
                  className="h-10 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90"
                >
                  Create complaint
                </button>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Edit Complaint Modal */}
      {isEditOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-background/70 p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-4xl animate-in fade-in zoom-in-95 duration-200">
            <Card>
              <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      if (editSaving) return;
                      setIsEditOpen(false);
                      setEditingId(null);
                    }}
                    className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition hover:bg-accent"
                    aria-label="Back"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                  <div>
                    <h2 className="font-display text-lg font-semibold text-foreground">Edit complaint</h2>
                    <p className="text-sm text-muted-foreground">Update complaint details</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (editSaving) return;
                    setIsEditOpen(false);
                    setEditingId(null);
                  }}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-accent"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="px-5 py-5">
                {editLoading ? (
                  <div className="text-sm text-muted-foreground">Loading complaint details...</div>
                ) : (
                  <form id="edit-complaint-form" className="grid grid-cols-1 gap-4 md:grid-cols-2" onSubmit={handleUpdate}>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-foreground">Assigned To *</label>
                      <select
                        value={editForm.assignedToId}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, assignedToId: e.target.value }))}
                        className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      >
                        <option value="">Select staff</option>
                        {staffOptions.map((staff) => (
                          <option key={staff.id} value={String(staff.id)}>{staff.full_name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-foreground">Category *</label>
                      <select
                        value={editForm.categoryId}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, categoryId: e.target.value }))}
                        className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      >
                        <option value="">Select category</option>
                        {complaintCategories.map((cat) => (
                          <option key={cat.id} value={String(cat.id)}>{cat.category_name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-foreground">Complaint Source *</label>
                      <select
                        value={editForm.complaintSource}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, complaintSource: e.target.value }))}
                        className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      >
                        {SOURCE_OPTIONS.map((option) => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-foreground">Status *</label>
                      <select
                        value={editForm.status}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, status: e.target.value }))}
                        className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                        disabled={statusOptions.length === 0}
                      >
                        {statusNames.map((name) => (
                          <option key={name} value={name}>{name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-foreground">Priority *</label>
                      <select
                        value={editForm.priority}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, priority: e.target.value }))}
                        className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      >
                        {PRIORITY_OPTIONS.map((option) => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-foreground">SLA Status *</label>
                      <select
                        value={editForm.slaStatus}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, slaStatus: e.target.value }))}
                        className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      >
                        {SLA_STATUS_OPTIONS.map((option) => (
                          <option key={option || "__empty"} value={option}>{option || "Select"}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-foreground">SLA Deadline *</label>
                      <input
                        type="datetime-local"
                        value={editForm.slaDeadline}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, slaDeadline: e.target.value }))}
                        className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>

                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-sm font-medium text-foreground">Complaint Details *</label>
                      <textarea
                        value={editForm.complaintDetails}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, complaintDetails: e.target.value }))}
                        rows={4}
                        className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>

                    {editFormError && <p className="text-sm text-danger md:col-span-2">{editFormError}</p>}
                  </form>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-4">
                <button
                  type="button"
                  onClick={() => {
                    if (editSaving) return;
                    setIsEditOpen(false);
                    setEditingId(null);
                  }}
                  className="h-10 rounded-lg border border-border bg-card px-4 text-sm font-medium text-foreground transition hover:bg-accent"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="edit-complaint-form"
                  disabled={editLoading || editSaving || statusOptions.length === 0}
                  className="h-10 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {editSaving ? "Updating..." : "Update complaint"}
                </button>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-background/70 p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
            <Card>
              <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      if (deleteSaving) return;
                      setIsDeleteOpen(false);
                      setDeleteTargetId(null);
                    }}
                    className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition hover:bg-accent"
                    aria-label="Back"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                  <div>
                    <h2 className="font-display text-lg font-semibold text-foreground">Delete complaint</h2>
                    <p className="text-sm text-muted-foreground">Are you sure you want to delete this complaint?</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (deleteSaving) return;
                    setIsDeleteOpen(false);
                    setDeleteTargetId(null);
                  }}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-accent"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-4">
                <button
                  type="button"
                  onClick={() => {
                    if (deleteSaving) return;
                    setIsDeleteOpen(false);
                    setDeleteTargetId(null);
                  }}
                  className="h-10 rounded-lg border border-border bg-card px-4 text-sm font-medium text-foreground transition hover:bg-accent"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    void handleDelete();
                  }}
                  disabled={deleteSaving}
                  className="h-10 rounded-lg bg-danger px-5 text-sm font-semibold text-danger-foreground shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {deleteSaving ? "Deleting..." : "Delete"}
                </button>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Attachment Preview Modal */}
      {isPreviewOpen && previewAttachments.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/10 p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative max-h-full w-full max-w-xl animate-in fade-in zoom-in-95 duration-200">
            <Card className="overflow-hidden border-0 shadow-2xl">
              <div className="flex items-center justify-between bg-neutral-800 px-3 py-1.5 text-neutral-300">
                <div className="flex items-center gap-2 truncate">
                  <span className="truncate text-sm font-medium text-white">
                    {previewAttachments[previewIndex]?.file_name || "Attachment"}
                  </span>
                  {previewAttachments.length > 1 && (
                    <span className="text-xs text-neutral-400">
                      {previewIndex + 1} / {previewAttachments.length}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-0.5">
                  <button
                    type="button"
                    onClick={handleZoomOut}
                    className="rounded p-1 transition hover:bg-neutral-700"
                    title="Zoom out"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="w-10 text-center text-xs font-semibold text-white">{zoom}%</span>
                  <button
                    type="button"
                    onClick={handleZoomIn}
                    className="rounded p-1 transition hover:bg-neutral-700"
                    title="Zoom in"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={handleDownload}
                    className="rounded p-1 transition hover:bg-neutral-700"
                    title="Download"
                  >
                    <Download className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={closePreview}
                    className="rounded p-1 transition hover:bg-neutral-700"
                    title="Close"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <div className="relative flex max-h-[60vh] items-center justify-center bg-neutral-900/90 p-2">
                {previewAttachments.length > 1 && (
                  <button
                    type="button"
                    onClick={prevAttachment}
                    className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-background/80 p-1.5 shadow-md transition hover:bg-accent"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                )}
                <div
                  className="flex max-h-full max-w-full items-center justify-center overflow-auto transition-transform duration-200"
                  style={{ transform: `scale(${zoom / 100})` }}
                >
                  {(() => {
                    const file = previewAttachments[previewIndex];
                    if (!file) return <p className="text-muted-foreground">No file to display</p>;

                    if (file.file_type.startsWith("image/")) {
                      return (
                        <img
                          src={`data:${file.file_type};base64,${file.base64_data}`}
                          alt={file.file_name}
                          className="max-h-full max-w-full object-contain"
                        />
                      );
                    } else if (file.file_type === "application/pdf") {
                      return (
                        <iframe
                          src={`data:${file.file_type};base64,${file.base64_data}`}
                          className="h-[50vh] w-full max-w-3xl"
                          title={file.file_name}
                        />
                      );
                    } else {
                      return (
                        <div className="flex flex-col items-center gap-2 p-4 text-muted-foreground">
                          <p className="text-sm">Preview not available for this file type.</p>
                          <button
                            type="button"
                            onClick={handleDownload}
                            className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90"
                          >
                            Download
                          </button>
                        </div>
                      );
                    }
                  })()}
                </div>
                {previewAttachments.length > 1 && (
                  <button
                    type="button"
                    onClick={nextAttachment}
                    className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-background/80 p-1.5 shadow-md transition hover:bg-accent"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                )}
              </div>

              {previewAttachments.length > 1 && (
                <div className="flex items-center gap-1.5 overflow-x-auto border-t border-neutral-700 bg-neutral-800/60 px-3 py-2">
                  {previewAttachments.map((att, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setPreviewIndex(idx);
                        setZoom(100);
                      }}
                      className={`flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded border-2 ${
                        idx === previewIndex ? "border-primary" : "border-transparent"
                      }`}
                    >
                      {att.file_type.startsWith("image/") ? (
                        <img
                          src={`data:${att.file_type};base64,${att.base64_data}`}
                          alt={att.file_name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-[10px] text-muted-foreground">
                          {att.file_name.split(".").pop()?.toUpperCase()}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      )}

      {/* Notes Drawer */}
      {selectedComplaint && (
        <NotesDrawer
          open={drawerOpen}
          onClose={() => {
            setDrawerOpen(false);
            setSelectedComplaint(null);
          }}
          ticketNo={selectedComplaint.ticket_no}
          moduleType="Complaint"
          moduleId={selectedComplaint.id}
          assignedTo={selectedComplaint.assigned_to}
          currentStatusId={selectedComplaint.status_id}
          currentNextAction={selectedComplaint.next_action_item || ""}
          statusOptions={drawerStatusOptions}
          onUpdate={refetchComplaints}
        />
      )}
    </>
  );
}