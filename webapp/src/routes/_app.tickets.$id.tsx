import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Card, CardHeader } from "@/components/ui-kit/Card";
import { StatusBadge, Chip } from "@/components/ui-kit/Chip";
import { NotesDrawer } from "@/components/common/NoteDrawer";
import { User, TicketIcon, Plus, ArrowLeft } from "lucide-react";
import { useParams } from "@tanstack/react-router";
import { ticketService } from "@/services/ticketService";
import { statusService } from "@/services/statusService"; 
import { formatLocalDateTime } from "@/utils/formatDate";
import { calculateSlaStatus } from "@/utils/slaUtils";

export const Route = createFileRoute("/_app/tickets/$id")({
  component: TicketDetailsPage,
});

function fmt(value: unknown): string {
  if (value === null || value === undefined) return "-";
  if (typeof value === "string" && value.trim() === "") return "-";
  return String(value);
}


function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-1 border-b border-border/60 py-3 last:border-0 sm:grid-cols-[180px_1fr] sm:gap-4 sm:py-2.5">
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground sm:text-sm sm:normal-case sm:tracking-normal">
        {label}
      </span>
      <span className="text-sm font-medium text-foreground">{children}</span>
    </div>
  );
}

export default function TicketDetailsPage() {
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [ticketData, setTicketData] = useState<any>(null);
  const { id } = useParams({ from: "/_app/tickets/$id" });
  const [statusOptions, setStatusOptions] = useState<{ id: number; status_name: string }[]>([]);
  const fetchTicket = async () => {
    try {
      setLoading(true);
      const data = await ticketService.getTicketByNumber(id);
      setTicketData(data);
    } catch (error) {
      toast.error("Failed to load ticket");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatuses = async () => {
    try {
      const statuses = await statusService.getStatuses();
      setStatusOptions(statuses.map((s: any) => ({ id: s.id, status_name: s.status_name })));
    } catch (error) {
      console.error("Failed to load status options:", error);
    }
  };

  const getSourceInfo = () => {
    if (ticketData?.ticket_type === "Complaint") {
      return {
        label: "Complaint Source",
        value: ticketData?.complaint_source ?? ticketData?.enquiry_source ?? "-",
      };
    }
    return {
      label: "Enquiry Source",
      value: ticketData?.enquiry_source ?? "-",
    };
  };

  const sourceInfo = getSourceInfo();

  // Inside the component, after ticketData is defined

const getResolvedClosedInfo = () => {
  if (ticketData?.ticket_type !== "Complaint") return null;
  if (ticketData?.status_name === "Resolved") {
    return {
      label: "Resolved At",
      value: ticketData?.resolved_at,
    };
  }
  if (ticketData?.status_name === "Closed") {
    return {
      label: "Closed At",
      value: ticketData?.closed_at,
    };
  }
  return null;
};

const resolvedClosedInfo = getResolvedClosedInfo();

  useEffect(() => {
    fetchTicket();
    fetchStatuses(); // load statuses for dropdown
  }, [id]);

  useEffect(() => {
    fetchTicket();
  }, [id]);

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
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={() =>
            navigate({
              to: ticketData?.ticket_type === "Complaint" ? "/complaints" : "/enquiries",
            })
          }
          className="flex h-9 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-sm font-medium text-muted-foreground transition hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <Chip tone="primary">
          <TicketIcon className="h-3 w-3" /> {ticketData?.ticket_no}
        </Chip>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Customer Details */}
        <Card>
          <CardHeader icon={<User className="h-4 w-4" />} title="Customer Details" />
          <div className="px-5 pb-5">
            <Row label="Customer Name">{fmt(ticketData?.customer_name)}</Row>
            <Row label="Email">{fmt(ticketData?.customer_email)}</Row>
            <Row label="Phone">{fmt(ticketData?.customer_phone)}</Row>
            <Row label="Ticket Type"><Chip tone="info">{fmt(ticketData?.ticket_type)}</Chip></Row>
            <Row label="Category">{fmt(ticketData?.category_name)}</Row>
            <Row label={sourceInfo.label}>{fmt(sourceInfo.value)}</Row>
          </div>
        </Card>

        {/* Ticket Details */}
        <Card>
          <CardHeader
            icon={<TicketIcon className="h-4 w-4" />}
            title="Ticket Details"
            action={
              <button
                onClick={() => setDrawerOpen(true)}
                className="flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90"
              >
                <Plus className="h-4 w-4" /> Notes
              </button>
            }
          />
          <div className="px-5 pb-5">
            <Row label="Ticket Number">
              <span className="rounded-md bg-primary-soft px-2 py-0.5 font-mono text-xs font-semibold text-primary">
                {fmt(ticketData?.ticket_no)}
              </span>
            </Row>
            <Row label="Status">
              <StatusBadge status={String(ticketData?.status_name ?? "Open")} />
            </Row>
            {resolvedClosedInfo && (
              <Row label={resolvedClosedInfo.label}>
                {formatLocalDateTime(resolvedClosedInfo.value) || "-"}
              </Row>
            )}
            <Row label="Created By">{fmt(ticketData?.created_by_name)}</Row>
            <Row label="Assigned To">{fmt(ticketData?.assigned_to_name)}</Row>
            <Row label="SLA Status">
              {getSlaBadge(
                calculateSlaStatus(ticketData?.sla_deadline, ticketData?.created_at)
              )}
            </Row>
            <Row label="SLA Deadline">{formatLocalDateTime(ticketData?.sla_deadline)}</Row>
            <Row label="Created Date">{formatLocalDateTime(ticketData?.created_at)}</Row>
            <Row label="Enquiry Details">{fmt(ticketData?.enquiry_details)}</Row>
            <Row label="Next Action Item">{fmt(ticketData?.next_action_item)}</Row>
            <Row label="Next Follow-up">{formatLocalDateTime(ticketData?.next_followup_date)}</Row>
          </div>
        </Card>
      </div>

      {/* Notes Drawer */}
      <NotesDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        ticketNo={ticketData?.ticket_no}
        moduleType={ticketData?.ticket_type}
        moduleId={ticketData?.module_id || ticketData?.id}
        assignedTo={ticketData?.assigned_to}
        currentStatusId={ticketData?.status_id || 1}
        currentNextAction={ticketData?.next_action_item || ""}
        statusOptions={statusOptions}
        onUpdate={fetchTicket}
      />
    </div>
  );
}