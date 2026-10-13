import { createFileRoute, useNavigate, Outlet, useLocation } from "@tanstack/react-router";
import { useEffect, useRef, useState, useMemo } from "react";
import { MoreVertical, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "@/utils/toast";
import { isAxiosError } from "axios";
import { usePageSearch } from "@/context/PageSearchContext";

// Import the real service and types
import { customerService, type Customer } from "@/services/customerService";

// --- Route definition ---
export const Route = createFileRoute("/_app/customers")({
  component: CustomersPage,
});

// --- Unified error handler – extracts detail and shows ONE toast ---
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
  return message;
};

// --- Main component ---
function CustomersPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [list, setList] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openMenu, setOpenMenu] = useState<number | null>(null);
  const [confirmId, setConfirmId] = useState<number | null>(null);

  // Global search context
  const { query, setResultCount } = usePageSearch();
  const searchTerm = query.trim().toLowerCase();

  // Ref to prevent duplicate API calls (strict mode double mount)
  const isFetching = useRef(false);

  const isBaseRoute = location.pathname === "/customers";
  if (!isBaseRoute) {
    return <Outlet />;
  }

  // Helper: format address with line breaks
  const formatAddress = (customer: Customer): string => {
    const parts = [customer.address, customer.city, customer.state].filter(Boolean);
    return parts.length > 0 ? parts.join("\n") : "—";
  };

  // Fetch customers on mount
  useEffect(() => {
    const fetchCustomers = async () => {
      if (isFetching.current) return;
      isFetching.current = true;
      try {
        setLoading(true);
        setError(null);
        const data = await customerService.getCustomers();
        setList(data);
      } catch (err) {
        const msg = handleApiError(err, "Failed to load customers.");
        setError(msg);
        console.error(err);
      } finally {
        setLoading(false);
        isFetching.current = false;
      }
    };
    fetchCustomers();
  }, []);

  // Filter by search query (global)
  const filtered = useMemo(() => {
    if (!searchTerm) return list;
    return list.filter(
      (c) =>
        c.full_name.toLowerCase().includes(searchTerm) ||
        c.email.toLowerCase().includes(searchTerm) ||
        (c.phone && c.phone.includes(searchTerm))
    );
  }, [list, searchTerm]);

  // Update match count in header
  useEffect(() => {
    setResultCount(filtered.length);
  }, [filtered, setResultCount]);

  const handleDelete = async (id: number) => {
    try {
      const data = await customerService.deleteCustomer(id);
      setList((prev) => prev.filter((c) => c.id !== id));
      toast.success(data?.message || "Customer deleted successfully.");
    } catch (err) {
      console.error(err);
      handleApiError(err, "Failed to delete customer.");
    } finally {
      setConfirmId(null);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">Loading customers…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center dark:border-red-800 dark:bg-red-950/20">
        <p className="text-red-600 dark:text-red-400">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-3 rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Local search input removed – header search only */}
        <div className="text-sm text-muted-foreground">
          {filtered.length} customer{filtered.length !== 1 && "s"}
        </div>
        <button
          onClick={() => navigate({ to: "/customers/create" })}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> Add Customer
        </button>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <th className="px-6 py-3">Name</th>
                <th className="px-6 py-3">Email</th>
                <th className="px-6 py-3">Phone</th>
                <th className="px-6 py-3">Address</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr
                  key={c.id}
                  className="border-b border-border last:border-0 transition hover:bg-accent/40"
                >
                  <td className="px-6 py-3.5 font-medium text-foreground">
                    {c.full_name}
                  </td>
                  <td className="px-6 py-3.5 text-muted-foreground">
                    {c.email}
                  </td>
                  <td className="px-6 py-3.5 text-muted-foreground">
                    {c.phone || "—"}
                  </td>
                  <td className="px-6 py-3.5 text-muted-foreground whitespace-pre-line">
                    {formatAddress(c)}
                  </td>
                  <td className="px-6 py-3.5">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        c.is_active && !c.is_deleted
                          ? "bg-green-500/10 text-green-700 dark:text-green-400"
                          : c.is_deleted
                            ? "bg-red-500/10 text-red-600 dark:text-red-400"
                            : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          c.is_active && !c.is_deleted
                            ? "bg-green-500"
                            : c.is_deleted
                              ? "bg-red-500"
                              : "bg-muted-foreground"
                        }`}
                      />
                      {c.is_deleted
                        ? "Deleted"
                        : c.is_active
                          ? "Active"
                          : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-right">
                    <RowMenu
                      open={openMenu === c.id}
                      onToggle={() =>
                        setOpenMenu((v) => (v === c.id ? null : c.id))
                      }
                      onClose={() => setOpenMenu(null)}
                      onEdit={() => {
                        setOpenMenu(null);
                        navigate({ to: `/customers/edit/${c.id}` });
                      }}
                      onDelete={() => {
                        setOpenMenu(null);
                        setConfirmId(c.id);
                      }}
                    />
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-10 text-center text-sm text-muted-foreground"
                  >
                    {searchTerm ? "No customers match your search" : "No customers yet"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {confirmId && (
        <ConfirmDialog
          name={list.find((c) => c.id === confirmId)?.full_name ?? "this customer"}
          onCancel={() => setConfirmId(null)}
          onConfirm={() => handleDelete(confirmId)}
        />
      )}
    </div>
  );
}

// --- Row menu component (unchanged) ---
function RowMenu({
  open,
  onToggle,
  onClose,
  onEdit,
  onDelete,
}: {
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, onClose]);

  return (
    <div ref={ref} className="relative inline-block">
      <button
        onClick={onToggle}
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition hover:bg-accent hover:text-primary"
        aria-label="More actions"
      >
        <MoreVertical className="h-4 w-4" />
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-1.5 w-40 overflow-hidden rounded-lg border border-border bg-card shadow-lg animate-in fade-in slide-in-from-top-1 duration-150">
          <button
            onClick={onEdit}
            className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm hover:bg-accent"
          >
            <Pencil className="h-4 w-4" /> Edit
          </button>
          <button
            onClick={onDelete}
            className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-red-600 hover:bg-red-500/10 dark:text-red-400"
          >
            <Trash2 className="h-4 w-4" /> Delete
          </button>
        </div>
      )}
    </div>
  );
}

// --- Confirmation dialog (unchanged) ---
function ConfirmDialog({
  name,
  onCancel,
  onConfirm,
}: {
  name: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div
        className="absolute inset-0 bg-foreground/30 backdrop-blur-sm"
        onClick={onCancel}
      />
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-card animate-in zoom-in-95 duration-150">
        <h3
          className="font-display text-lg font-semibold"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Delete customer?
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">
          This will permanently remove{" "}
          <span className="font-medium text-foreground">{name}</span>. This
          action cannot be undone.
        </p>
        <div className="mt-5 flex items-center justify-end gap-3">
          <button
            onClick={onCancel}
            className="h-10 rounded-lg border border-border bg-card px-5 text-sm font-medium hover:bg-accent"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="h-10 rounded-lg bg-red-600 px-5 text-sm font-semibold text-white shadow-sm hover:opacity-90"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}