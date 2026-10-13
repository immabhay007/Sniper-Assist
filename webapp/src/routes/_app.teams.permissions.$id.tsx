import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Lock } from "lucide-react";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui-kit/Card";
import { teamService, type TeamUser } from "@/services/teamService";
import { toast } from "@/utils/toast";

export const Route = createFileRoute("/_app/teams/permissions/$id")({
  component: PermissionsPage,
});

type PermKey = "create" | "edit" | "delete" | "export" | "upload";
const PERM_KEYS: PermKey[] = ["create", "edit", "delete", "export", "upload"];

// Internal row state
type RowState = {
  menu_id: number;
  menu_key: string;
  menu_name: string;
  access: boolean;
  perms: Record<PermKey, boolean>;
};

function PermissionsPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [member, setMember] = useState<TeamUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [rows, setRows] = useState<RowState[]>([]);

  // Fetch user, menus, and permissions
  const fetchData = async () => {
    try {
      setLoading(true);
      const userId = Number(id);

      // Fetch user
      const users = await teamService.getTeams();
      const found = users.find((u) => u.id === userId);
      if (!found) {
        toast.error("User not found.");
        navigate({ to: "/teams" });
        return;
      }
      setMember(found);

      // Fetch menus and permissions in parallel
      const [menus, permissions] = await Promise.all([
        teamService.getMenus(),
        teamService.getPermissions(userId),
      ]);

      // Build rows from menus, merging permissions if available
      const permissionMap = new Map<number, typeof permissions[0]>();
      permissions.forEach((p) => permissionMap.set(p.menu_id, p));

      const newRows = menus.map((menu) => {
        const perm = permissionMap.get(menu.id);
        return {
          menu_id: menu.id,
          menu_key: menu.menu_key,
          menu_name: menu.menu_name,
          access: perm?.can_view ?? false,
          perms: {
            create: perm?.can_create ?? false,
            edit: perm?.can_edit ?? false,
            delete: perm?.can_delete ?? false,
            export: perm?.can_export ?? false,
            upload: perm?.can_upload ?? false,
          },
        };
      });
      setRows(newRows);
    } catch (error) {
      console.error("Failed to load data:", error);
      toast.error("Failed to load permissions data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
  }, [id, navigate]);

  // Update a row's access or permission
  const updateRow = (menuId: number, patch: Partial<RowState>) => {
    setRows((prev) =>
      prev.map((r) => (r.menu_id === menuId ? { ...r, ...patch } : r))
    );
  };

  const updatePerm = (menuId: number, key: PermKey, value: boolean) => {
    setRows((prev) =>
      prev.map((r) =>
        r.menu_id === menuId
          ? { ...r, perms: { ...r.perms, [key]: value } }
          : r
      )
    );
  };

  // Bulk actions
  const setAllAccess = (value: boolean) => {
    setRows((prev) => prev.map((r) => ({ ...r, access: value })));
  };

  const setAllPerm = (key: PermKey, value: boolean) => {
    setRows((prev) =>
      prev.map((r) => ({ ...r, perms: { ...r.perms, [key]: value } }))
    );
  };

  const grantFullPermissions = () => {
    setRows((prev) =>
      prev.map((r) => ({
        ...r,
        access: true,
        perms: {
          create: true,
          edit: true,
          delete: true,
          export: true,
          upload: true,
        },
      }))
    );
  };

  const clearAll = () => {
    setRows((prev) =>
      prev.map((r) => ({
        ...r,
        access: false,
        perms: {
          create: false,
          edit: false,
          delete: false,
          export: false,
          upload: false,
        },
      }))
    );
  };

  // Save permissions
  const handleSave = async () => {
    try {
      setSaving(true);
      const payload = {
        permissions: rows.map((r) => ({
          menu_id: r.menu_id,
          can_view: r.access,
          can_create: r.perms.create,
          can_edit: r.perms.edit,
          can_delete: r.perms.delete,
          can_export: r.perms.export,
          can_upload: r.perms.upload,
        })),
        updated_at: new Date().toISOString(),
      };
      await teamService.updatePermissions(Number(id), payload);
      toast.success("Permissions updated successfully.");
      // Refresh data after save
      await fetchData();
    } catch (error) {
      console.error("Failed to save permissions:", error);
      toast.error("Failed to save permissions.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Link
          to="/teams"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" /> Back to team
        </Link>
        <Card><div className="p-8 text-center text-muted-foreground">Loading...</div></Card>
      </div>
    );
  }

  if (!member || rows.length === 0) {
    return (
      <div className="space-y-4">
        <Link
          to="/teams"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" /> Back to team
        </Link>
        <Card>
          <div className="p-8 text-center text-muted-foreground">
            {!member ? "Member not found." : "No menus available."}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-4 p-6">
          <div className="flex items-start gap-3">
            <Link
              to="/teams"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-primary"
              aria-label="Back"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-primary" />
                <h2 className="font-display text-xl font-semibold tracking-tight">
                  Menu permissions
                </h2>
              </div>
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                Control which sidebar menus and actions{" "}
                <span className="font-medium text-foreground">{member.full_name}</span> can use.
                Menus are fetched from the system automatically.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate({ to: "/teams" })}
              className="h-10 rounded-lg border border-border bg-card px-5 text-sm font-medium hover:bg-accent"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="h-10 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm hover:opacity-90 disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save permissions"}
            </button>
          </div>
        </div>

        <div className="mx-6 mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-border bg-muted/40 px-4 py-3">
          <span className="text-sm font-medium text-muted-foreground">Quick actions</span>
          <QuickChip onClick={() => setAllAccess(true)}>Enable all access</QuickChip>
          <QuickChip onClick={grantFullPermissions} primary>
            Grant full permissions
          </QuickChip>
          <QuickChip onClick={clearAll} warning>
            Clear all
          </QuickChip>
        </div>

        <div className="border-t border-border">
          <div className="grid grid-cols-12 gap-4 px-6 py-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <div className="col-span-4">Menu</div>
            <div className="col-span-2">
              Access
              <div className="mt-1 flex gap-2 text-[11px] font-medium normal-case tracking-normal">
                <button
                  onClick={() => setAllAccess(true)}
                  className="text-primary hover:underline"
                >
                  All on
                </button>
                <span className="text-border">·</span>
                <button
                  onClick={() => setAllAccess(false)}
                  className="text-muted-foreground hover:text-primary"
                >
                  All off
                </button>
              </div>
            </div>
            <div className="col-span-6">
              Permissions
              <div className="mt-1 flex flex-wrap gap-1.5">
                {PERM_KEYS.map((k) => (
                  <button
                    key={k}
                    onClick={() => setAllPerm(k, true)}
                    className="rounded-full border border-primary/30 bg-primary-soft px-2.5 py-0.5 text-[11px] font-medium text-primary hover:bg-primary/10"
                  >
                    All {cap(k)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {rows.map((r) => (
            <div
              key={r.menu_id}
              className="grid grid-cols-12 items-center gap-4 border-t border-border px-6 py-4"
            >
              <div className="col-span-4">
                <p className="font-semibold text-foreground">{r.menu_name}</p>
                <p className="text-xs text-muted-foreground">{r.menu_key}</p>
              </div>
              <div className="col-span-2">
                <Toggle
                  checked={r.access}
                  onChange={(v) => updateRow(r.menu_id, { access: v })}
                />
              </div>
              <div className="col-span-6 flex flex-wrap gap-2">
                {PERM_KEYS.map((k) => (
                  <PermPill
                    key={k}
                    label={cap(k)}
                    active={r.perms[k]}
                    disabled={!r.access}
                    onClick={() => updatePerm(r.menu_id, k, !r.perms[k])}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// Helper components
function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function QuickChip({
  children,
  onClick,
  primary,
  warning,
}: {
  children: React.ReactNode;
  onClick: () => void;
  primary?: boolean;
  warning?: boolean;
}) {
  const base = "rounded-full px-3.5 py-1.5 text-xs font-semibold transition";
  if (primary)
    return (
      <button
        onClick={onClick}
        className={`${base} bg-primary text-primary-foreground hover:opacity-90`}
      >
        {children}
      </button>
    );
  if (warning)
    return (
      <button
        onClick={onClick}
        className={`${base} border border-warning/40 bg-warning-soft text-warning hover:bg-warning/10`}
      >
        {children}
      </button>
    );
  return (
    <button
      onClick={onClick}
      className={`${base} border border-border bg-card text-foreground hover:bg-accent`}
    >
      {children}
    </button>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 rounded-full transition ${
        checked ? "bg-primary" : "bg-muted"
      }`}
      aria-pressed={checked}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
          checked ? "left-[22px]" : "left-0.5"
        }`}
      />
    </button>
  );
}

function PermPill({
  label,
  active,
  disabled,
  onClick,
}: {
  label: string;
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
        disabled
          ? "border-border bg-muted text-muted-foreground opacity-60"
          : active
          ? "border-primary bg-primary text-primary-foreground shadow-sm"
          : "border-primary/30 bg-primary-soft text-primary hover:bg-primary/10"
      }`}
    >
      {label}
    </button>
  );
}