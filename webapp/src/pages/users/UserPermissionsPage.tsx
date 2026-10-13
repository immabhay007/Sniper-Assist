import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import DashboardLayout from "@/layout/DashboardLayout";
import UserPermissionsEditor from "@/components/users/UserPermissionsEditor";
import { userService } from "@/services/userService";
import { mapPermissionsForSave, permissionService } from "@/services/permissionService";
import { getApiErrorMessage } from "@/utils/apiError";
import { toast } from "@/utils/toast";
import { useAuth } from "@/context/AuthContext";
import { can } from "@/utils/permissions";
import { HiOutlineArrowLeft, HiOutlineLockClosed } from "react-icons/hi";

function SavePermissionsButton({ busy, canEdit, saving }) {
  return (
    <button
      type="submit"
      className="sniper-btn sniper-btn-primary"
      disabled={!canEdit || busy}
    >
      {saving ? "Saving…" : "Save permissions"}
    </button>
  );
}

export default function UserPermissionsPage({ userId }) {
  const navigate = useNavigate();
  const { user: actor } = useAuth();
  const canEdit = can(actor, "users", "can_edit");

  const [member, setMember] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingPerms, setSavingPerms] = useState(false);

  const id = Number(userId);

  const load = useCallback(async () => {
    if (!id || Number.isNaN(id)) return;
    setLoading(true);
    try {
      const [u, perms] = await Promise.all([
        userService.get(id),
        permissionService.getForUser(id),
      ]);
      setMember(u);
      setPermissions(perms);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to load permissions"));
      setMember(null);
      setPermissions([]);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const savePermissions = async (e) => {
    e.preventDefault();
    if (!canEdit || !id) return;
    setSavingPerms(true);
    try {
      const saved = await permissionService.saveForUser(
        id,
        mapPermissionsForSave(permissions),
      );
      setPermissions(saved);
      toast.success("Permissions saved.");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to save permissions"));
    } finally {
      setSavingPerms(false);
    }
  };

  const memberLabel = member
    ? `${member.full_name}${member.email ? ` · ${member.email}` : ""}`
    : "Team member";

  const backToTeam = (
    <Link
      to="/users"
      className="inline-flex items-center justify-center size-8 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground shrink-0 transition"
      title="Back to team"
      aria-label="Back to team"
    >
      <HiOutlineArrowLeft className="size-4" />
    </Link>
  );

  return (
    <DashboardLayout
      title="Manage permissions"
      subtitle={memberLabel}
    >
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : !member ? (
        <div className="sniper-card p-6">
          <p className="text-sm text-muted-foreground mb-4">Team member not found.</p>
          <button type="button" className="sniper-btn" onClick={() => navigate({ to: "/users" })}>
            Return to team
          </button>
        </div>
      ) : (
        <section className="sniper-card p-6 w-full">
          {permissions.length === 0 ? (
            <>
              <div className="flex items-center gap-2 mb-2">
                {backToTeam}
                <h3 className="text-[15px] font-semibold flex items-center gap-2">
                  <HiOutlineLockClosed className="size-5" /> Menu permissions
                </h3>
              </div>
              <p className="text-sm text-muted-foreground">
                No menus are registered yet. Add menus from Settings → Menus, then return here to
                assign access.
              </p>
            </>
          ) : (
            <form onSubmit={savePermissions}>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-4 pb-4 border-b border-border">
                <div className="min-w-0 flex-1 flex items-start gap-2">
                  {backToTeam}
                  <div className="min-w-0">
                    <h3 className="text-[15px] font-semibold flex items-center gap-2">
                      <HiOutlineLockClosed className="size-5" /> Menu permissions
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Control which sidebar menus and actions {member.full_name} can use. Menus must
                      be registered under Settings → Menus before they appear here.
                    </p>
                  </div>
                </div>
                <div className="flex flex-row flex-nowrap items-center gap-3 shrink-0">
                  <SavePermissionsButton
                    busy={savingPerms}
                    canEdit={canEdit}
                    saving={savingPerms}
                  />
                  <Link to="/users" className="sniper-btn whitespace-nowrap">
                    Cancel
                  </Link>
                </div>
              </div>

              <UserPermissionsEditor
                permissions={permissions}
                onChange={setPermissions}
                disabled={!canEdit || savingPerms}
              />

              <div className="mt-6 pt-4 border-t border-border flex flex-row flex-nowrap items-center gap-3">
                <SavePermissionsButton busy={savingPerms} canEdit={canEdit} saving={savingPerms} />
                <Link to="/users" className="sniper-btn whitespace-nowrap">
                  Cancel
                </Link>
              </div>
              {!canEdit && (
                <p className="mt-3 text-xs text-muted-foreground">
                  You can view permissions but need Edit access on Team to change them.
                </p>
              )}
            </form>
          )}
        </section>
      )}
    </DashboardLayout>
  );
}
