import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import DashboardLayout from "@/layout/DashboardLayout";
import Modal from "@/components/common/Modal";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import UserCard from "@/components/users/UserCard";
import UserFormFields from "@/components/users/UserFormFields";
import UserPermissionsEditor from "@/components/users/UserPermissionsEditor";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { userService } from "@/services/userService";
import { mapPermissionsForSave, permissionService } from "@/services/permissionService";
import { getApiErrorMessage } from "@/utils/apiError";
import { toast } from "@/utils/toast";
import { useAuth } from "@/context/AuthContext";
import { can } from "@/utils/permissions";
import { HiOutlineLockClosed, HiOutlineUserAdd } from "react-icons/hi";
import { useFilteredRows } from "@/hooks/useFilteredRows";
import { USER_SEARCH_FIELDS } from "@/utils/pageSearchFilter";

const emptyForm = () => ({
  full_name: "",
  email: "",
  phone: "",
  role_id: "",
  password: "",
});

function CreateMemberActions({ saving, onCancel }) {
  return (
    <>
      <button type="submit" className="sniper-btn sniper-btn-primary" disabled={saving}>
        {saving ? "Creating…" : "Create member & send invite"}
      </button>
      <button type="button" className="sniper-btn whitespace-nowrap" onClick={onCancel}>
        Cancel
      </button>
    </>
  );
}

export default function UsersList() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const canCreate = can(user, "users", "can_create");
  const canEdit = can(user, "users", "can_edit");
  const canDelete = can(user, "users", "can_delete");
  const canView = can(user, "users", "can_view");

  const [team, setTeam] = useState([]);
  const [roles, setRoles] = useState([]);
  const [tab, setTab] = useState("list");
  const [addForm, setAddForm] = useState(emptyForm());
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState(emptyForm());
  const [deleteId, setDeleteId] = useState(null);
  const [toggleTarget, setToggleTarget] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [inviteInfo, setInviteInfo] = useState(null);
  const [addPermissions, setAddPermissions] = useState([]);
  const [permsLoading, setPermsLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [users, roleList] = await Promise.all([
        userService.list({ activeOnly: false }),
        userService.listRoles(),
      ]);
      setTeam(users);
      setRoles(roleList);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to load team members"));
      setTeam([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (roles.length && !addForm.role_id) {
      setAddForm((f) => ({ ...f, role_id: String(roles[0].id) }));
    }
  }, [roles]);

  useEffect(() => {
    if (tab !== "add" || !canCreate) return;
    let cancelled = false;
    setPermsLoading(true);
    permissionService
      .getTemplateForNewUser()
      .then((items) => {
        if (!cancelled) setAddPermissions(items);
      })
      .catch(() => {
        if (!cancelled) setAddPermissions([]);
      })
      .finally(() => {
        if (!cancelled) setPermsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [tab, canCreate]);

  const filteredTeam = useFilteredRows(team, USER_SEARCH_FIELDS);
  const activeUsers = filteredTeam.filter((u) => u.is_active);
  const inactiveUsers = filteredTeam.filter((u) => !u.is_active);

  const submitAdd = async (e) => {
    e.preventDefault();
    if (!addForm.full_name?.trim() || !addForm.email?.trim() || !addForm.role_id) return;
    setSaving(true);
    try {
      const created = await userService.create(addForm);
      let permWarning = "";
      if (canEdit && addPermissions.length) {
        try {
          await permissionService.saveForUser(
            created.id,
            mapPermissionsForSave(addPermissions),
          );
        } catch (permErr) {
          permWarning = getApiErrorMessage(
            permErr,
            "Member was created but permissions could not be saved.",
          );
        }
      }
      setAddForm(roles[0] ? { ...emptyForm(), role_id: String(roles[0].id) } : emptyForm());
      const template = await permissionService.getTemplateForNewUser();
      setAddPermissions(template);
      if (created.temporary_password || created.onboarding_email_sent || created.onboarding_email_error) {
        setInviteInfo({
          name: created.full_name,
          email: created.email,
          password: created.temporary_password,
          emailSent: !!created.onboarding_email_sent,
          emailError: created.onboarding_email_error || null,
        });
      }
      await load();
      setTab("list");
      toast.success("Team member created");
      if (permWarning) toast.warning(permWarning);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to create team member"));
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (u) => {
    setEditId(u.id);
    setEditForm({
      full_name: u.full_name,
      email: u.email,
      phone: u.phone || "",
      role_id: String(u.role_id),
      password: "",
    });
  };

  const openPermissions = (u) => {
    navigate({
      to: "/users/$userId/permissions",
      params: { userId: String(u.id) },
    });
  };

  const submitEdit = async (e) => {
    e.preventDefault();
    if (!editId || !editForm.full_name?.trim() || !editForm.email?.trim()) return;
    setSaving(true);
    try {
      await userService.update(editId, editForm);
      setEditId(null);
      await load();
      toast.success("Team member updated");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to update team member"));
    } finally {
      setSaving(false);
    }
  };

  const confirmToggleActive = async () => {
    if (!toggleTarget) return;
    setSaving(true);
    try {
      await userService.update(toggleTarget.id, { is_active: !toggleTarget.is_active });
      setToggleTarget(null);
      await load();
      toast.success(toggleTarget.is_active ? "Team member deactivated" : "Team member activated");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to update status"));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    setSaving(true);
    try {
      await userService.remove(deleteId);
      setDeleteId(null);
      await load();
      toast.success("Team member deleted");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to delete team member"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout title="Team" subtitle="Onboard and manage Sniper care users">
      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="mb-5">
          <TabsTrigger value="list">Team members</TabsTrigger>
          {canCreate && <TabsTrigger value="add">Add member</TabsTrigger>}
        </TabsList>

        <TabsContent value="list">
          <div className="sniper-card p-6">
            <h3 className="text-[15px] font-semibold mb-4">Active ({activeUsers.length})</h3>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading team…</p>
            ) : activeUsers.length === 0 && inactiveUsers.length === 0 ? (
              <p className="text-sm text-muted-foreground">No team members yet. Add one in the Add member tab.</p>
            ) : activeUsers.length === 0 ? (
              <p className="text-sm text-muted-foreground">No active members.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {activeUsers.map((u) => (
                  <UserCard
                    key={u.id}
                    u={u}
                    saving={saving}
                    toggling={saving && toggleTarget?.id === u.id}
                    deleting={saving && deleteId === u.id}
                    canEdit={canEdit}
                    canDelete={canDelete}
                    canManagePermissions={canView}
                    onEdit={openEdit}
                    onManagePermissions={openPermissions}
                    onRequestToggle={setToggleTarget}
                    onDelete={setDeleteId}
                  />
                ))}
              </div>
            )}

            {inactiveUsers.length > 0 && (
              <>
                <h3 className="text-[15px] font-semibold mt-8 mb-4 text-muted-foreground">
                  Inactive ({inactiveUsers.length})
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {inactiveUsers.map((u) => (
                    <UserCard
                      key={u.id}
                      u={u}
                      inactive
                      saving={saving}
                      toggling={saving && toggleTarget?.id === u.id}
                      deleting={saving && deleteId === u.id}
                      canEdit={canEdit}
                      canDelete={canDelete}
                      canManagePermissions={canView}
                      onEdit={openEdit}
                      onManagePermissions={openPermissions}
                      onRequestToggle={setToggleTarget}
                      onDelete={setDeleteId}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </TabsContent>

        {canCreate && (
        <TabsContent value="add">
          <form onSubmit={submitAdd} className="space-y-6 w-full">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-border">
              <h3 className="text-[15px] font-semibold flex items-center gap-2">
                <HiOutlineUserAdd className="size-5" /> Onboard team member
              </h3>
              <div className="flex flex-row flex-nowrap items-center gap-3 shrink-0">
                <CreateMemberActions saving={saving} onCancel={() => setTab("list")} />
              </div>
            </div>

            <div className="sniper-card p-6 w-full">
              <h3 className="text-[15px] font-semibold mb-4">Member details</h3>
              <UserFormFields form={addForm} setForm={setAddForm} roles={roles} />
            </div>

            <div className="sniper-card p-6 w-full">
              <h3 className="text-[15px] font-semibold mb-2 flex items-center gap-2">
                <HiOutlineLockClosed className="size-5" /> Menu permissions
              </h3>
              <p className="text-xs text-muted-foreground mb-4">
                Choose which menus and actions this member can use after they are created.
              </p>
              {permsLoading ? (
                <p className="text-sm text-muted-foreground">Loading menus…</p>
              ) : addPermissions.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No menus are registered yet. Add menus from Settings → Menus, then return here.
                </p>
              ) : (
                <UserPermissionsEditor
                  permissions={addPermissions}
                  onChange={setAddPermissions}
                  disabled={!canEdit || saving}
                />
              )}
              {!canEdit && addPermissions.length > 0 && (
                <p className="mt-3 text-xs text-muted-foreground">
                  You can preview permissions but need Edit access on Team to assign them. An
                  administrator can set permissions after creation.
                </p>
              )}
            </div>

            <div className="flex flex-row flex-nowrap items-center gap-3 pt-4 border-t border-border">
              <CreateMemberActions saving={saving} onCancel={() => setTab("list")} />
            </div>
          </form>
        </TabsContent>
        )}
      </Tabs>

      <Modal
        open={!!editId}
        onClose={() => setEditId(null)}
        title="Edit team member"
        size="md"
      >
        <form onSubmit={submitEdit}>
          <UserFormFields form={editForm} setForm={setEditForm} roles={roles} showPasswordHint />
          <div className="mt-6 flex justify-end gap-2">
            <button type="button" className="sniper-btn" onClick={() => setEditId(null)}>
              Cancel
            </button>
            <button type="submit" className="sniper-btn sniper-btn-primary" disabled={saving}>
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={!!inviteInfo} onClose={() => setInviteInfo(null)} title="Member created" size="md">
        {inviteInfo?.emailSent ? (
          <p className="text-sm text-muted-foreground mb-3">
            A welcome email with sign-in details was sent to <strong>{inviteInfo.email}</strong>.
            {inviteInfo.password
              ? " The temporary password below is also shown once here as a backup."
              : ""}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground mb-3">
            Share these credentials with <strong>{inviteInfo?.name}</strong>. The temporary password is shown only once.
          </p>
        )}
        <dl className="text-sm space-y-2 bg-muted/30 rounded-lg p-4">
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Email</dt>
            <dd className="font-medium">{inviteInfo?.email}</dd>
          </div>
          {inviteInfo?.password && (
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Temporary password</dt>
              <dd className="font-mono font-semibold">{inviteInfo.password}</dd>
            </div>
          )}
        </dl>
        {!inviteInfo?.emailSent && (
          <div
            role="alert"
            className="text-xs text-danger bg-danger-soft border border-danger/20 rounded-md px-3 py-2 mt-3"
          >
            Welcome email was not sent.
            {inviteInfo?.emailError
              ? ` ${inviteInfo.emailError}`
              : " Check ZEPTO_API_TOKEN (Send Mail Token) in the backend .env and restart the API."}
          </div>
        )}
        <div className="mt-5 flex justify-end">
          <button type="button" className="sniper-btn sniper-btn-primary" onClick={() => setInviteInfo(null)}>
            Done
          </button>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!toggleTarget}
        title={toggleTarget?.is_active ? "Deactivate member?" : "Activate member?"}
        description={
          toggleTarget
            ? toggleTarget.is_active
              ? `"${toggleTarget.full_name}" will be marked inactive.`
              : `"${toggleTarget.full_name}" will be marked active.`
            : ""
        }
        tone={toggleTarget?.is_active ? "danger" : "primary"}
        confirming={saving && !!toggleTarget}
        confirmText={
          saving && toggleTarget
            ? toggleTarget.is_active
              ? "Deactivating…"
              : "Activating…"
            : toggleTarget?.is_active
              ? "Deactivate"
              : "Activate"
        }
        onCancel={() => !saving && setToggleTarget(null)}
        onConfirm={confirmToggleActive}
      />

      <ConfirmDialog
        open={!!deleteId}
        title="Delete team member?"
        description="This member will be soft-deleted and cannot sign in."
        tone="danger"
        confirming={saving && !!deleteId}
        confirmText={saving && deleteId ? "Deleting…" : "Delete"}
        onCancel={() => !saving && setDeleteId(null)}
        onConfirm={confirmDelete}
      />
    </DashboardLayout>
  );
}
