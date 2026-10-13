import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState, useRef } from "react";
import { Card, CardHeader } from "@/components/ui-kit/Card";
import { CaseIntakeForm, type CaseIntakeValues } from "@/components/forms/CaseIntakeForm";
import { userService } from "@/services/userService";
import { toast } from "@/utils/toast";
import { usePageSearch } from "@/context/PageSearchContext";
import {
  ArrowLeft,
  ClipboardCheck,
  Plus,
  X,
  StickyNote,
  MoreVertical,
  Paperclip,
  Eye,
  Download,
  Minus,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import api from "@/config/axios";
import { isAxiosError } from "axios";
import { formatLocalDateTime } from "@/utils/formatDate";
import { Chip, PriorityBadge, StatusBadge } from "@/components/ui-kit/Chip";
import { NotesDrawer } from "@/components/common/NoteDrawer";
import { useFloating, autoUpdate, offset, flip, shift } from '@floating-ui/react';
import { calculateSlaStatus } from "@/utils/slaUtils";

export const Route = createFileRoute("/_app/assignments")({
  component: AssignmentsPage,
});

type Attachment = {
  file_name: string;
  file_type: string;
  base64_data: string;
};

type AssignmentTicket = {
  id: number;
  ticket_no: string;
  customer_name: string | null;
  category_id?: number;
  category_name: string;
  created_by?: number;
  created_by_name: string;
  assigned_to?: number | null;
  assigned_to_name: string | null;
  status_id?: number;
  status_name: string;
  complaint_source?: string | null;
  enquiry_source?: string | null;
  complaint_details?: string | null;
  enquiry_details?: string | null;
  priority?: string | null;
  sla_status: string;
  sla_deadline: string;
  created_at: string;
  updated_at?: string;
  type?: "complaint" | "enquiry";
  attachments: Attachment[];
  next_action_item?: string | null;
};

type MyAssignmentsResponse = {
  user_id: number;
  user_name: string;
  role: string;
  from_date: string;
  to_date: string;
  total_complaints: number;
  total_enquiries: number;
  complaints: AssignmentTicket[];
  enquiries: AssignmentTicket[];
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

const STATUS_OPTIONS = ["Open", "In Progress", "Pending", "Resolved", "Closed"];
const MONTH_OPTIONS = ["All", ...MONTHS] as const;

const STATUS_TO_ID: Record<string, number> = {
  Open: 11,
  "In Progress": 12,
  Pending: 13,
  Resolved: 14,
  Closed: 15,
};

const ID_TO_STATUS: Record<number, string> = {
  1: "Open",
  2: "In Progress",
  3: "Pending",
  4: "Resolved",
  5: "Closed",
};

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

function getLocalUserId(): number | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem("sniper-care-user");
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { id?: unknown };
    const id = Number(parsed?.id);
    return Number.isFinite(id) ? id : null;
  } catch {
    return null;
  }
}

// Unified error handler – shows one toast with the appropriate message
const handleApiError = (error: unknown, defaultMessage: string) => {
  if (isAxiosError(error) && error.response?.status === 403) {
    const detail = (error.response.data as { detail?: string })?.detail || "You don't have permission to perform this action.";
    toast.error(detail);
  } else {
    toast.error(defaultMessage);
  }
};

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

function AssignmentTable({
  title,
  rows,
  moduleType,
  onStatusChange,
  getStatusBadgeClasses,
  onOpenPreview,
  statusOptions,
  onUpdate,
}: {
  title: string;
  rows: AssignmentTicket[];
  moduleType: "enquiry" | "complaint";
  onStatusChange: (rowId: number, newStatus: string) => Promise<void>;
  getStatusBadgeClasses: (status: string) => string;
  onOpenPreview: (attachments: Attachment[]) => void;
  statusOptions: { id: number; status_name: string }[];
  onUpdate: () => void;
}) {
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<AssignmentTicket | null>(null);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
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

  const moduleTypeForDrawer = moduleType === "enquiry" ? "Enquiry" : "Complaint";

  return (
    <div>
      <h3 className="px-5 pb-2 text-sm font-semibold">{title}</h3>
      {rows.length === 0 ? (
        <div className="px-5 pb-5 text-sm text-muted-foreground">No records found.</div>
      ) : (
        <div className="overflow-x-auto px-2 pb-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-3 py-2 font-semibold">Ticket ID</th>
                <th className="px-3 py-2 font-semibold">Category</th>
                <th className="px-3 py-2 font-semibold">Customer</th>
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
              {rows.map((row) => (
                <tr key={`${title}-${row.id}`} className="border-t border-border hover:bg-accent/50">
                  <td className="px-3 py-3 font-medium">
                    <button
                      type="button"
                      onClick={() =>
                        navigate({
                          to: "/tickets/$id",
                          params: { id: row.ticket_no },
                        })
                      }
                      className="cursor-pointer text-primary hover:underline"
                    >
                      {row.ticket_no}
                    </button>
                  </td>
                  <td className="px-3 py-3">{row.category_name || "-"}</td>
                  <td className="px-3 py-3">{row.customer_name || "-"}</td>
                  <td className="px-3 py-3">{row.created_by_name || "-"}</td>
                  <td className="px-3 py-3">{formatLocalDateTime(row.created_at) || "-"}</td>
                  <td className="px-3 py-3">
                    {getSlaBadge(calculateSlaStatus(row.sla_deadline, row.created_at))}
                  </td>
                  <td className="px-3 py-3">{formatLocalDateTime(row.sla_deadline) || "-"}</td>
                  <td className="px-3 py-3">{row.complaint_details || row.enquiry_details || "-"}</td>
                  <td className="px-3 py-3">
                    {row.attachments && row.attachments.length > 0 ? (
                      <button
                        type="button"
                        onClick={() => onOpenPreview(row.attachments)}
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
                      value={row.status_name || "Open"}
                      onChange={(e) => onStatusChange(row.id, e.target.value)}
                      className={`cursor-pointer rounded-full border-0 px-3 py-1 text-xs font-medium ${getStatusBadgeClasses(row.status_name || "Open")}`}
                      style={{ backgroundImage: "none" }}
                    >
                      {STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-3">
                    <div className="relative flex justify-center">
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
                              setSelectedTicket(row);
                              setDrawerOpen(true);
                            }}
                          >
                            <StickyNote className="h-4 w-4" />
                            View Note
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

      {/* Notes Drawer */}
      {selectedTicket && (
        <NotesDrawer
          open={drawerOpen}
          onClose={() => {
            setDrawerOpen(false);
            setSelectedTicket(null);
          }}
          ticketNo={selectedTicket.ticket_no}
          moduleType={moduleTypeForDrawer}
          moduleId={selectedTicket.id}
          assignedTo={selectedTicket.assigned_to ?? null}
          currentStatusId={selectedTicket.status_id ?? 1}
          currentNextAction={selectedTicket.next_action_item || ""}
          statusOptions={statusOptions}
          onUpdate={onUpdate}
        />
      )}
    </div>
  );
}

function AssignmentsPage() {
  const navigate = useNavigate();
  const now = new Date();
  const [month, setMonth] = useState<string>(MONTHS[now.getMonth()]);
  const [year, setYear] = useState<number>(now.getFullYear());
  const [data, setData] = useState<MyAssignmentsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [isNewOpen, setIsNewOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<"enquiry" | "complaint">("enquiry");
  const [tab, setTab] = useState<"enquiry" | "complaint">("enquiry");
  const [categoryFilter, setCategoryFilter] = useState<string>("All");
  const [createdByFilter, setCreatedByFilter] = useState<string>("All");
  const [slaStatusFilter, setSlaStatusFilter] = useState<string>("All");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [assignedToFilter, setAssignedToFilter] = useState<string>("All");

  // Preview state
  const [previewAttachments, setPreviewAttachments] = useState<Attachment[]>([]);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [zoom, setZoom] = useState(100);

  // Ref to prevent duplicate API calls (strict mode double mount)
  const isFetching = useRef(false);
  const { query, setQuery, setResultCount } = usePageSearch();
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Sync local input with global query
  useEffect(() => {
    setSearchTerm(query);
  }, [query]);
  const yearOptions = useMemo(
    () => [now.getFullYear() - 2, now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1],
    [now],
  );

  const getComputedSlaStatus = (row: AssignmentTicket) =>
    calculateSlaStatus(row.sla_deadline, row.created_at);

  const drawerStatusOptions = useMemo(() =>
    STATUS_OPTIONS.map(name => ({ id: STATUS_TO_ID[name], status_name: name })),
    []
  );

  const currentRows = useMemo(() => {
    if (tab === "enquiry") return data?.enquiries ?? [];
    return data?.complaints ?? [];
  }, [tab, data]);

  const categoryOptions = useMemo(() => {
    const names = currentRows.map((r) => r.category_name).filter(Boolean);
    return ["All", ...Array.from(new Set(names))];
  }, [currentRows]);

  const assignedToOptions = useMemo(() => {
    const names = currentRows.map((r) => r.assigned_to_name).filter(Boolean);
    return ["All", ...Array.from(new Set(names))];
  }, [currentRows]);

  const createdByOptions = useMemo(() => {
    const names = currentRows.map((r) => r.created_by_name).filter(Boolean);
    return ["All", ...Array.from(new Set(names))];
  }, [currentRows]);

  const slaStatusOptions = useMemo(() => {
    const computedStatuses = currentRows.map((r) => getComputedSlaStatus(r)).filter(Boolean);
    return ["All", ...Array.from(new Set(computedStatuses))];
  }, [currentRows]);

  const statusOptions = useMemo(() => {
    const names = currentRows.map((r) => r.status_name).filter(Boolean);
    return ["All", ...Array.from(new Set(names))];
  }, [currentRows]);

  const handleStatusChange = async (rowId: number, newStatus: string) => {
    const currentRow = currentRows.find((r) => r.id === rowId);
    const oldStatus = currentRow?.status_name || "Open";

    const updateRows = (prev: AssignmentTicket[]) =>
      prev.map((row) => (row.id === rowId ? { ...row, status_name: newStatus } : row));

    setData((prevData) => {
      if (!prevData) return prevData;
      const updated = { ...prevData };
      if (tab === "enquiry") {
        updated.enquiries = updateRows(updated.enquiries);
      } else {
        updated.complaints = updateRows(updated.complaints);
      }
      return updated;
    });

    try {
      const statusId = STATUS_TO_ID[newStatus];
      if (!statusId) throw new Error(`Invalid status: ${newStatus}`);
      const endpoint = tab === "enquiry" ? "enquiries" : "complaints";
      await api.put(`/${endpoint}/${rowId}/status?status_id=${statusId}`);
      toast.success("Status updated successfully.");
    } catch (error) {
      // Rollback
      setData((prevData) => {
        if (!prevData) return prevData;
        const rolled = { ...prevData };
        const rollback = (prev: AssignmentTicket[]) =>
          prev.map((row) => (row.id === rowId ? { ...row, status_name: oldStatus } : row));
        if (tab === "enquiry") {
          rolled.enquiries = rollback(rolled.enquiries);
        } else {
          rolled.complaints = rollback(rolled.complaints);
        }
        return rolled;
      });
      handleApiError(error, "Failed to update status.");
    }
  };

  const filteredRows = useMemo(() => {
    return currentRows.filter((row) => {
      if (categoryFilter !== "All" && row.category_name !== categoryFilter) return false;
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
          row.complaint_details?.toLowerCase().includes(term) ||
          row.enquiry_details?.toLowerCase().includes(term)
        );
      }
      return true;
    });
  }, [currentRows, categoryFilter, createdByFilter, slaStatusFilter, statusFilter, searchTerm]);

  useEffect(() => {
    setResultCount(filteredRows.length);
  }, [filteredRows, setResultCount]);


  // Load function with duplicate‑call prevention
  const loadAssignments = async () => {
    if (isFetching.current) return;
    isFetching.current = true;
    setLoading(true);
    setError("");
    try {
      const userId = getLocalUserId();
      if (!userId) {
        setData(null);
        setError("User ID not found in localStorage key sniper-care-user.");
        toast.error("User ID not found.");
        return;
      }
      const range = getDateRange(month, year);
      const response = await userService.getMyAssignments({
        userId,
        fromDate: range?.fromDate,
        toDate: range?.toDate,
      });
      setData(response as MyAssignmentsResponse);
    } catch (err) {
      setData(null);
      const defaultMsg = "Failed to load my assignments.";
      handleApiError(err, defaultMsg);
      // Set error state to show inline message
      if (isAxiosError(err) && err.response?.status === 403) {
        const detail = (err.response.data as { detail?: string })?.detail || defaultMsg;
        setError(detail);
      } else {
        setError(defaultMsg);
      }
    } finally {
      setLoading(false);
      isFetching.current = false;
    }
  };

  useEffect(() => {
    void loadAssignments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month, year]);

  const refetchAssignments = async () => {
    // Use the same load function; it will skip if already fetching
    void loadAssignments();
  };

  const handleCreate = async (values: CaseIntakeValues) => {
    try {
      const formData = new FormData();
      formData.append("customer_name", values.customerId);
      formData.append("category_id", values.categoryId);
      formData.append("created_by", values.createdById);
      if (values.assignedToId) formData.append("assigned_to", values.assignedToId);
      if (values.orderId.trim()) formData.append("order_id", values.orderId.trim());
      formData.append(selectedType === "enquiry" ? "enquiry_source" : "complaint_source", values.source);
      if (values.scheduleBookingTime) formData.append("schedule_booking_time", values.scheduleBookingTime);
      if (values.servicesBooked.trim()) formData.append("services_booked", values.servicesBooked.trim());
      formData.append(selectedType === "enquiry" ? "enquiry_details" : "complaint_details", values.details);
      const statusMap: Record<string, number> = {
        Open: 1,
        "In Progress": 2,
        Pending: 3,
        Resolved: 4,
        Closed: 5,
      };
      formData.append("status_id", String(statusMap[values.status] ?? 1));
      formData.append("priority", values.priority);
      if (values.slaDeadline) formData.append("sla_deadline", values.slaDeadline);
      if (values.slaStatus) formData.append("sla_status", values.slaStatus);
      if (values.firstResponseAt) formData.append("first_response_at", values.firstResponseAt);
      if (values.resolvedAt) formData.append("resolved_at", values.resolvedAt);
      if (values.closedAt) formData.append("closed_at", values.closedAt);

      values.files.forEach((file) => {
        formData.append("files", file);
      });

      const endpoint = selectedType === "enquiry" ? "/enquiries/" : "/complaints/";
      await api.post(endpoint, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setIsNewOpen(false);
      await refetchAssignments();
      toast.success(`${selectedType === "enquiry" ? "Enquiry" : "Complaint"} created successfully.`);
    } catch (err) {
      console.error("Failed to create assignment:", err);
      const defaultMsg = "Failed to create assignment.";
      if (isAxiosError(err) && err.response?.status === 403) {
        const detail = (err.response.data as { detail?: string })?.detail || "You don't have permission to create assignments.";
        toast.error(detail);
      } else if (isAxiosError(err) && err.response?.data) {
        const detail = Array.isArray((err.response.data as { detail?: unknown }).detail)
          ? ((err.response.data as { detail: Array<{ msg?: string }> }).detail[0]?.msg || defaultMsg)
          : defaultMsg;
        toast.error(detail);
      } else {
        toast.error(defaultMsg);
      }
    }
  };

  // Preview functions
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
          icon={<ClipboardCheck className="h-4 w-4" />}
          title="My assignments"
          action={
            <div className="flex items-center gap-2">
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
              <span className="text-xs text-muted-foreground">{filteredRows.length} results</span>
            </div>
          }
        />

        <div className="px-5 pb-4">
          <div className="flex items-center justify-between gap-3">
            <div className="inline-flex rounded-xl bg-muted p-1">
              {(["enquiry", "complaint"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                    tab === t ? "bg-card text-foreground shadow-card" : "text-muted-foreground"
                  }`}
                >
                  {t === "enquiry" ? "Enquiries" : "Complaints"}
                </button>
              ))}
            </div>
            <span className="text-sm text-muted-foreground">
              {tab === "enquiry"
                ? `${data?.enquiries?.length ?? 0} Enquiries`
                : `${data?.complaints?.length ?? 0} Complaints`}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 px-5 pb-4">
          <select
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="h-9 rounded-lg border border-input bg-card px-3 text-sm"
          >
            {MONTH_OPTIONS.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>

          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="h-9 rounded-lg border border-input bg-card px-3 text-sm"
          >
            {yearOptions.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-9 rounded-lg border border-input bg-card px-3 text-sm"
          >
            {categoryOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt === "All" ? "Category" : opt}
              </option>
            ))}
          </select>

          <select
            value={createdByFilter}
            onChange={(e) => setCreatedByFilter(e.target.value)}
            className="h-9 rounded-lg border border-input bg-card px-3 text-sm"
          >
            {createdByOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt === "All" ? "Created By" : opt}
              </option>
            ))}
          </select>

          <select
            value={slaStatusFilter}
            onChange={(e) => setSlaStatusFilter(e.target.value)}
            className="h-9 rounded-lg border border-input bg-card px-3 text-sm"
          >
            {slaStatusOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt === "All" ? "SLA Status" : opt}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 rounded-lg border border-input bg-card px-3 text-sm"
          >
            {statusOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt === "All" ? "Status" : opt}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="px-5 pb-6 text-sm text-muted-foreground">Loading assignments...</div>
        ) : error ? (
          <div className="px-5 pb-6 text-sm text-danger">{error}</div>
        ) : (
          <div className="pb-2">
            {tab === "enquiry" ? (
              <AssignmentTable
                title={`Enquiries (${filteredRows.length})`}
                rows={filteredRows}
                moduleType="enquiry"
                onStatusChange={handleStatusChange}
                getStatusBadgeClasses={getStatusBadgeClasses}
                onOpenPreview={openPreview}
                statusOptions={drawerStatusOptions}
                onUpdate={refetchAssignments}
              />
            ) : (
              <AssignmentTable
                title={`Complaints (${filteredRows.length})`}
                rows={filteredRows}
                moduleType="complaint"
                onStatusChange={handleStatusChange}
                getStatusBadgeClasses={getStatusBadgeClasses}
                onOpenPreview={openPreview}
                statusOptions={drawerStatusOptions}
                onUpdate={refetchAssignments}
              />
            )}
          </div>
        )}
      </Card>

      {/* New Assignment Modal */}
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
                    <h2 className="font-display text-lg font-semibold text-foreground">New assignment</h2>
                    <p className="text-sm text-muted-foreground">Create and assign a new ticket</p>
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

              <div className="border-b border-border px-5 py-3">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedType("enquiry")}
                    className={`px-3 py-2 text-sm font-medium transition ${
                      selectedType === "enquiry"
                        ? "border-b-2 border-primary text-primary"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Enquiry
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedType("complaint")}
                    className={`px-3 py-2 text-sm font-medium transition ${
                      selectedType === "complaint"
                        ? "border-b-2 border-primary text-primary"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Complaint
                  </button>
                </div>
              </div>

              <div className="px-5 py-5">
                <CaseIntakeForm formId="new-assignment-form" kind={selectedType} onSubmit={handleCreate} />
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
                  form="new-assignment-form"
                  className="h-10 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90"
                >
                  Create assignment
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
              <div className="flex items-center justify-between bg-neutral-800 px-2 py-1 text-neutral-300">
                <div className="flex items-center gap-2 truncate">
                  <span className="truncate text-xs font-medium text-white">
                    {previewAttachments[previewIndex]?.file_name || "Attachment"}
                  </span>
                  {previewAttachments.length > 1 && (
                    <span className="text-[10px] text-neutral-400">
                      {previewIndex + 1} / {previewAttachments.length}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-0.5">
                  <button
                    type="button"
                    onClick={handleZoomOut}
                    className="rounded p-0.5 transition hover:bg-neutral-700"
                    title="Zoom out"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="w-8 text-center text-[10px] font-semibold text-white">{zoom}%</span>
                  <button
                    type="button"
                    onClick={handleZoomIn}
                    className="rounded p-0.5 transition hover:bg-neutral-700"
                    title="Zoom in"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    onClick={handleDownload}
                    className="rounded p-0.5 transition hover:bg-neutral-700"
                    title="Download"
                  >
                    <Download className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    onClick={closePreview}
                    className="rounded p-0.5 transition hover:bg-neutral-700"
                    title="Close"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              </div>

              <div className="relative flex max-h-[70vh] items-center justify-center bg-neutral-900/90 p-1">
                {previewAttachments.length > 1 && (
                  <button
                    type="button"
                    onClick={prevAttachment}
                    className="absolute left-1 top-1/2 z-10 -translate-y-1/2 rounded-full bg-background/80 p-1 shadow-md transition hover:bg-accent"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </button>
                )}
                <div
                  className="flex max-h-full max-w-full items-center justify-center overflow-auto transition-transform duration-200"
                  style={{ transform: `scale(${zoom / 100})` }}
                >
                  {(() => {
                    const file = previewAttachments[previewIndex];
                    if (!file) return <p className="text-xs text-muted-foreground">No file</p>;

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
                          className="h-[40vh] w-full max-w-xl"
                          title={file.file_name}
                        />
                      );
                    } else {
                      return (
                        <div className="flex flex-col items-center gap-1 p-2 text-muted-foreground">
                          <p className="text-xs">Preview not available.</p>
                          <button
                            type="button"
                            onClick={handleDownload}
                            className="rounded-lg bg-primary px-2 py-1 text-xs font-medium text-primary-foreground hover:opacity-90"
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
                    className="absolute right-1 top-1/2 z-10 -translate-y-1/2 rounded-full bg-background/80 p-1 shadow-md transition hover:bg-accent"
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {previewAttachments.length > 1 && (
                <div className="flex items-center gap-1 overflow-x-auto border-t border-neutral-700 bg-neutral-800/60 px-2 py-1.5">
                  {previewAttachments.map((att, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setPreviewIndex(idx);
                        setZoom(100);
                      }}
                      className={`flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded border-2 ${
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
                        <span className="text-[8px] text-muted-foreground">
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
    </>
  );
}