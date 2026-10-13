import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { StatCard, Card, CardHeader } from "@/components/ui-kit/Card";
import { Chip, PriorityBadge, StatusBadge } from "@/components/ui-kit/Chip";
import { PillSelect } from "@/components/TicketTable";
import { dashboardService } from "@/services/dashboardService";
import { formatLocalDateTime } from "@/utils/formatDate";
import { categoryService } from "@/services/categoryService";
import { calculateSlaStatus } from "@/utils/slaUtils";
import { toast } from "@/utils/toast";
import { isAxiosError } from "axios";
import { usePageSearch } from "@/context/PageSearchContext";
import {
  Ticket as TicketIcon,
  CheckCircle2,
  Clock,
  Inbox,
  MessageSquare,
  TrendingUp,
} from "lucide-react";

export const Route = createFileRoute("/_app/dashboard")({
  component: Dashboard,
});

const MONTH_OPTIONS = [
  "All",
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

const SLA_STATUS_OPTIONS = ["All", "Breached", "Approaching", "On Track"];

function getDateRange(monthName: string, yearValue: string) {
  const year = Number(yearValue);
  if (!Number.isFinite(year)) return null;

  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  if (monthName === "All") {
    const start = new Date(year, 0, 1);
    const end = new Date(year, 11, 31);
    return { fromDate: fmt(start), toDate: fmt(end) };
  }

  const monthIndex = MONTH_OPTIONS.indexOf(monthName) - 1;
  if (monthIndex < 0 || monthIndex > 11) return null;

  const start = new Date(year, monthIndex, 1);
  const end = new Date(year, monthIndex + 1, 0);
  return { fromDate: fmt(start), toDate: fmt(end) };
}

// Unified error handler for API calls
const handleApiError = (error: unknown, defaultMessage: string) => {
  if (isAxiosError(error) && error.response?.status === 403) {
    const detail = (error.response.data as { detail?: string })?.detail || "You don't have permission to perform this action.";
    toast.error(detail);
  } else {
    toast.error(defaultMessage);
  }
};

function Dashboard() {
  const now = new Date();
  const [month, setMonth] = useState(MONTH_OPTIONS[now.getMonth() + 1]);
  const [year, setYear] = useState(String(now.getFullYear()));
  const [categoryFilter, setCategoryFilter] = useState("All");
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [categoryOptions, setCategoryOptions] = useState<string[]>(["All"]);
  const [slaStatusFilter, setSlaStatusFilter] = useState("All");
  const { query, setResultCount } = usePageSearch();
  const searchTerm = query.trim().toLowerCase();
  const yearOptions = useMemo(
    () => [String(now.getFullYear() - 1), String(now.getFullYear()), String(now.getFullYear() + 1)],
    [now],
  );

  const getComputedSlaStatus = (ticket: any) =>
    calculateSlaStatus(ticket.sla_deadline, ticket.created_at);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const [enquiryCats, complaintCats] = await Promise.all([
          categoryService.listEnquiryCategories(),
          categoryService.listComplaintCategories(),
        ]);

        const names = [
          ...enquiryCats.map((c: any) => c.category_name).filter(Boolean),
          ...complaintCats.map((c: any) => c.category_name).filter(Boolean),
        ];

        const uniqueNames = Array.from(new Set(names)).sort();
        setCategoryOptions(["All", ...uniqueNames]);
      } catch (err) {
        console.error("Failed to load categories for filter:", err);
        handleApiError(err, "Failed to load categories.");
        setCategoryOptions(["All"]);
      }
    };

    void loadCategories();
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [month, year]);

  
  async function loadDashboard() {
    try {
      setLoading(true);
      const range = getDateRange(month, year);

      const data = await dashboardService.getdashboards({
        fromDate: range?.fromDate,
        toDate: range?.toDate,
      });

      setDashboardData(data);
    } catch (err) {
      console.error(err);
      handleApiError(err, "Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  }

  const enquiries = dashboardData?.recent_enquiries || [];
  const complaints = dashboardData?.recent_complaints || [];
  const recentTickets = dashboardData?.recent_tickets || [];
  const categories = dashboardData?.volume_by_category || [];
  const summaries = dashboardData?.summaries || dashboardData?.summary || {};

  // Determine if any filter (other than "All") is active
  const isFiltered = categoryFilter !== "All" || slaStatusFilter !== "All";

  const filteredTickets = useMemo(() => {
    let tickets = recentTickets;

    // Category filter
    if (categoryFilter !== "All") {
      const filterValue = categoryFilter.trim().toLowerCase();
      tickets = tickets.filter((t: any) =>
        t.category_name?.trim().toLowerCase() === filterValue
      );
    }

    // SLA Status filter
    if (slaStatusFilter !== "All") {
      tickets = tickets.filter((t: any) =>
        getComputedSlaStatus(t) === slaStatusFilter
      );
    }

    if (searchTerm) {
      tickets = tickets.filter((t: any) =>
        (t.ticket_no?.toLowerCase().includes(searchTerm) ?? false) ||
        (t.customer_name?.toLowerCase().includes(searchTerm) ?? false) ||
        (t.category_name?.toLowerCase().includes(searchTerm) ?? false) ||
        (t.module_type?.toLowerCase().includes(searchTerm) ?? false)
      );
    }

    return tickets;
  }, [recentTickets, categoryFilter, slaStatusFilter, searchTerm]);

  useEffect(() => {
    setResultCount(filteredTickets.length);
  }, [filteredTickets, setResultCount]);

  const filteredEnquiries = useMemo(() => {
    return filteredTickets.filter((t: any) => t.module_type === "Enquiry");
  }, [filteredTickets]);

  const filteredComplaints = useMemo(() => {
    return filteredTickets.filter((t: any) => t.module_type === "Complaint");
  }, [filteredTickets]);

  // KPI summaries – use API data when no filters, otherwise compute from filtered tickets
  const filteredSummaries = useMemo(() => {
    if (!isFiltered) {
      return {
        open_tickets: summaries.open_tickets ?? 0,
        in_progress_tickets: summaries.in_progress_tickets ?? 0,
        resolved_tickets: summaries.resolved_tickets ?? 0,
        closed_tickets: summaries.closed_tickets ?? 0,
      };
    }
    const open = filteredTickets.filter((t: any) => t.status_name === "Open").length;
    const inProgress = filteredTickets.filter((t: any) => t.status_name === "In Progress").length;
    const resolved = filteredTickets.filter((t: any) => t.status_name === "Resolved").length;
    const closed = filteredTickets.filter((t: any) => t.status_name === "Closed").length;
    return {
      open_tickets: open,
      in_progress_tickets: inProgress,
      resolved_tickets: resolved,
      closed_tickets: closed,
    };
  }, [isFiltered, filteredTickets, summaries]);

  // Volume by category – use API data when no filters, otherwise compute from filtered tickets
  const filteredCategories = useMemo(() => {
    if (!isFiltered) {
      return categories; // use API's volume_by_category directly
    }
    const map = new Map();
    filteredTickets.forEach((t: any) => {
      const key = `${t.module_type}-${t.category_name}`;
      if (!map.has(key)) {
        map.set(key, {
          module_type: t.module_type || "Other",
          category_name: t.category_name || "Uncategorized",
          category_id: t.category_id || 0,
          total: 0,
        });
      }
      map.get(key).total += 1;
    });
    return Array.from(map.values());
  }, [isFiltered, filteredTickets, categories]);

  const groupedCategories = useMemo(() => {
    return filteredCategories.reduce((acc: any, item: any) => {
      const moduleType = item.module_type || "Other";
      if (!acc[moduleType]) acc[moduleType] = [];
      acc[moduleType].push(item);
      return acc;
    }, {});
  }, [filteredCategories]);

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

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <PillSelect
          value={month}
          onChange={setMonth}
          options={MONTH_OPTIONS}
          placeholder="All"
        />

        <PillSelect
          value={year}
          onChange={setYear}
          options={yearOptions}
          placeholder="Year"
        />

        <PillSelect
          value={categoryFilter}
          onChange={setCategoryFilter}
          options={categoryOptions}
          placeholder="All categories"
        />

        <PillSelect
          value={slaStatusFilter}
          onChange={setSlaStatusFilter}
          options={SLA_STATUS_OPTIONS}
          placeholder="SLA Status"
        />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Open tickets"
          value={filteredSummaries.open_tickets}
          hint="Current open enquiries & complaints"
          icon={<Inbox className="h-5 w-5" />}
          tone="success"
        />
        <StatCard
          label="In progress"
          value={filteredSummaries.in_progress_tickets}
          hint="Tickets being processed"
          icon={<Clock className="h-5 w-5" />}
          tone="warning"
        />
        <StatCard
          label="Resolved"
          value={filteredSummaries.resolved_tickets}
          hint="Resolved tickets"
          icon={<CheckCircle2 className="h-5 w-5" />}
          tone="primary"
        />
        <StatCard
          label="Closed"
          value={filteredSummaries.closed_tickets}
          hint="Closed tickets"
          icon={<CheckCircle2 className="h-5 w-5" />}
          tone="primary"
        />
      </div>

      {/* Two column */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader
            icon={<MessageSquare className="h-4 w-4" />}
            title="Recent enquiries"
            action={
              <Link
                to="/enquiries"
                className="text-xs font-medium text-primary hover:underline"
              >
                View all
              </Link>
            }
          />

          <div className="divide-y divide-border px-5 pb-5">
            {filteredEnquiries.map((t: any) => (
              <div
                key={t.id}
                className="flex items-center justify-between gap-3 py-3"
              >
                <div className="min-w-0">
                  <Link
                    to="/tickets/$id"
                    params={{ id: t.ticket_no }}
                    className="truncate text-sm font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    {t.ticket_no || "-"}
                  </Link>

                  <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{t.customer_name || "-"}</span>
                    <span>•</span>
                    <span>{formatLocalDateTime(t.created_at) || "-"}</span>
                    <span className="ml-1">
                      {getSlaBadge(calculateSlaStatus(t.sla_deadline, t.created_at))}
                    </span>
                  </div>
                </div>

                <Chip tone="primary">
                  {t.category_name || "-"}
                </Chip>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader
            icon={<TicketIcon className="h-4 w-4" />}
            title="Recent complaints"
            action={
              <Link
                to="/complaints"
                className="text-xs font-medium text-primary hover:underline"
              >
                View all
              </Link>
            }
          />

          <div className="divide-y divide-border px-5 pb-5">
            {filteredComplaints.map((t: any) => (
              <div
                key={t.id}
                className="flex items-center justify-between gap-3 py-3"
              >
                <div className="min-w-0">
                  <Link
                    to="/tickets/$id"
                    params={{ id: t.ticket_no }}
                    className="truncate text-sm font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    {t.ticket_no || "-"}
                  </Link>

                  <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{t.customer_name ? `${t.customer_name}` : "-"}</span>
                    <span>•</span>
                    <span>{formatLocalDateTime(t.created_at) || "-"}</span>
                    <span className="ml-1">
                      {getSlaBadge(calculateSlaStatus(t.sla_deadline, t.created_at))}
                    </span>
                    <PriorityBadge priority={t.priority || "Medium"} />
                  </div>
                </div>

                <StatusBadge status={t.status_name || "Open"} />
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Volume by category */}
      <Card>
        <CardHeader
          icon={<TrendingUp className="h-4 w-4" />}
          title="Volume by category"
        />

        <div className="px-5 pb-6">
          {Object.entries(groupedCategories).map(
            ([moduleType, moduleCategories]: [string, any], index) => (
              <div key={moduleType}>
                {index > 0 && <hr className="my-5 border-border" />}

                <h3 className="mb-3 text-sm font-semibold text-primary">
                  {moduleType}
                </h3>

                <div className="space-y-3">
                  {moduleCategories.map((c: any) => {
                    const pct = Math.min(100, c.total || 0);

                    return (
                      <div
                        key={`${moduleType}-${c.category_id}`}
                        className="grid grid-cols-[220px_1fr_90px] items-center gap-4"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {c.category_name}
                          </p>

                          <p className="text-xs text-muted-foreground">
                            {c.total} tickets
                          </p>
                        </div>

                        <div className="relative h-2.5 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-primary"
                            style={{ width: `${pct}%` }}
                          />
                        </div>

                        <div className="text-right text-sm font-semibold tabular-nums">
                          {c.total}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )
          )}
        </div>
      </Card>

      {/* Recent tickets table */}
      <Card>
        <CardHeader
          icon={<TicketIcon className="h-4 w-4" />}
          title="Recent tickets"
        />

        <div className="overflow-x-auto px-2 pb-3">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-3 py-2 font-semibold">Ticket ID</th>
                <th className="px-3 py-2 font-semibold">Module</th>
                <th className="px-3 py-2 font-semibold">Category</th>
                <th className="px-3 py-2 font-semibold">Customer</th>
                <th className="px-3 py-2 font-semibold">Created</th>
                <th className="px-3 py-2 font-semibold">SLA Status</th>
                <th className="px-3 py-2 font-semibold">SLA Deadline</th>
                <th className="px-3 py-2 font-semibold">Status</th>
              </tr>
            </thead>

            <tbody>
              {filteredTickets.map((t: any) => (
                <tr
                  key={t.id}
                  className="border-t border-border hover:bg-accent/50"
                >
                  <td className="px-3 py-3 font-mono text-xs">
                    {t.ticket_no ? (
                      <button
                        type="button"
                        onClick={() =>
                          navigate({
                            to: "/tickets/$id",
                            params: {
                              id: t.ticket_no,
                            },
                          })
                        }
                        className="cursor-pointer text-primary hover:underline"
                      >
                        {t.ticket_no}
                      </button>
                    ) : (
                      "-"
                    )}
                  </td>

                  <td className="px-3 py-3">
                    {t.module_type || "-"}
                  </td>

                  <td className="px-3 py-3">
                    {t.category_name || "-"}
                  </td>

                  <td className="px-3 py-3">
                    {t.customer_name || "-"}
                  </td>

                  <td className="px-3 py-3 text-muted-foreground whitespace-nowrap">
                    {t.created_at ? formatLocalDateTime(t.created_at) : "-"}
                  </td>

                  <td className="px-3 py-3">
                    {getSlaBadge(calculateSlaStatus(t.sla_deadline, t.created_at))}
                  </td>

                  <td className="px-3 py-3 text-muted-foreground whitespace-nowrap">
                    {t.sla_deadline ? formatLocalDateTime(t.sla_deadline) : "-"}
                  </td>

                  <td className="px-3 py-3">
                    <StatusBadge status={t.status_name || "Open"} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {!loading && filteredTickets.length === 0 && (
            <div className="py-10 text-center text-sm text-muted-foreground">
              No tickets found
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}