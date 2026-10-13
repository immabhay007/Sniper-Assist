import { useCallback, useEffect, useState } from "react";
import DashboardLayout from "@/layout/DashboardLayout";
import Modal from "@/components/common/Modal";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import RoleFormFields from "@/components/roles/RoleFormFields";
import RoleCard from "@/components/roles/RoleCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { roleService } from "@/services/roleService";
import { getApiErrorMessage } from "@/utils/apiError";
import { toast } from "@/utils/toast";
import { useAuth } from "@/context/AuthContext";
import { can } from "@/utils/permissions"
import { HiOutlineShieldCheck } from "react-icons/hi";
import { useFilteredRows } from "@/hooks/useFilteredRows";
import { ROLE_SEARCH_FIELDS } from "@/utils/pageSearchFilter";

const emptyForm = () => ({ role_name: "", description: "" });

export default function RolesList() {
  const { user } = useAuth();
  const canView = can(user, "roles", "can_view");
  const canCreate = can(user, "roles", "can_create");
  const canEdit = can(user, "roles", "can_edit");
  const canDelete = can(user, "roles", "can_delete");

  const [roles, setRoles] = useState([]);
  const [tab, setTab] = useState("list");
  const [addForm, setAddForm] = useState(emptyForm());
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState(emptyForm());
  const [deleteId, setDeleteId] = useState(null);
  const [toggleTarget, setToggleTarget] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!canView) return;
    setLoading(true);
    try {
      setRoles(await roleService.list({ activeOnly: false }));
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to load roles"));
      setRoles([]);
    } finally {
      setLoading(false);
    }
  }, [canView]);

  useEffect(() => {
    load();
  }, [load]);

  const filteredRoles = useFilteredRows(roles, ROLE_SEARCH_FIELDS);
  const activeRoles = filteredRoles.filter((r) => r.is_active);
  const inactiveRoles = filteredRoles.filter((r) => !r.is_active);

  const submitAdd = async (e) => {
    e.preventDefault();
    if (!canCreate || !addForm.role_name?.trim()) return;
    setSaving(true);
    try {
      await roleService.create(addForm);
      setAddForm(emptyForm());
      await load();
      setTab("list");
      toast.success("Role created");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to create role"));
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (r) => {
    setEditId(r.id);
    setEditForm({
      role_name: r.role_name,
      description: r.description || "",
    });
  };

  const submitEdit = async (e) => {
    e.preventDefault();
    if (!canEdit || !editId || !editForm.role_name?.trim()) return;
    setSaving(true);
    try {
      await roleService.update(editId, editForm);
      setEditId(null);
      await load();
      toast.success("Role updated");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to update role"));
    } finally {
      setSaving(false);
    }
  };

  const confirmToggleActive = async () => {
    if (!canEdit || !toggleTarget) return;
    setSaving(true);
    try {
      await roleService.update(toggleTarget.id, { is_active: !toggleTarget.is_active });
      setToggleTarget(null);
      await load();
      toast.success(toggleTarget.is_active ? "Role deactivated" : "Role activated");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to update status"));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!canDelete || !deleteId) return;
    setSaving(true);
    try {
      await roleService.remove(deleteId);
      setDeleteId(null);
      await load();
      toast.success("Role deleted");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to delete role"));
    } finally {
      setSaving(false);
    }
  };

  if (!canView) {
    return (
      <DashboardLayout title="Roles" subtitle="Manage application roles">
        <div className="sniper-card p-6 text-sm text-muted-foreground">
          You do not have permission to view roles. Contact an administrator.
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Roles" subtitle="Manage roles assigned to team members">
      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="mb-5">
          <TabsTrigger value="list">All roles</TabsTrigger>
          {canCreate && <TabsTrigger value="add">Add role</TabsTrigger>}
        </TabsList>

        <TabsContent value="list">
          <div className="sniper-card p-6">
            <h3 className="text-[15px] font-semibold mb-4">Active ({activeRoles.length})</h3>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading roles…</p>
            ) : activeRoles.length === 0 && inactiveRoles.length === 0 ? (
              <p className="text-sm text-muted-foreground">No roles yet.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {activeRoles.map((r) => (
                  <RoleCard
                    key={r.id}
                    role={r}
                    saving={saving}
                    toggling={saving && toggleTarget?.id === r.id}
                    deleting={saving && deleteId === r.id}
                    canEdit={canEdit}
                    canDelete={canDelete}
                    onEdit={openEdit}
                    onRequestToggle={setToggleTarget}
                    onDelete={setDeleteId}
                  />
                ))}
              </div>
            )}

            {inactiveRoles.length > 0 && (
              <>
                <h3 className="text-[15px] font-semibold mt-8 mb-4 text-muted-foreground">
                  Inactive ({inactiveRoles.length})
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {inactiveRoles.map((r) => (
                    <RoleCard
                      key={r.id}
                      role={r}
                      inactive
                      saving={saving}
                      toggling={saving && toggleTarget?.id === r.id}
                      deleting={saving && deleteId === r.id}
                      canEdit={canEdit}
                      canDelete={canDelete}
                      onEdit={openEdit}
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
            <form onSubmit={submitAdd} className="sniper-card p-6 max-w-3xl">
              <h3 className="text-[15px] font-semibold mb-4 flex items-center gap-2">
                <HiOutlineShieldCheck className="size-5" /> New role
              </h3>
              <RoleFormFields form={addForm} setForm={setAddForm} />
              <div className="mt-6 flex gap-3">
                <button type="submit" className="sniper-btn sniper-btn-primary" disabled={saving}>
                  {saving ? "Saving…" : "Save role"}
                </button>
                <button type="button" className="sniper-btn" onClick={() => setTab("list")}>
                  Cancel
                </button>
              </div>
            </form>
          </TabsContent>
        )}
      </Tabs>

      <Modal open={!!editId} onClose={() => setEditId(null)} title="Edit role" size="lg">
        <form onSubmit={submitEdit}>
          <RoleFormFields form={editForm} setForm={setEditForm} />
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

      <ConfirmDialog
        open={!!toggleTarget}
        title={toggleTarget?.is_active ? "Deactivate role?" : "Activate role?"}
        description={
          toggleTarget
            ? `"${toggleTarget.role_name}" will be ${toggleTarget.is_active ? "deactivated" : "activated"}.`
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
        title="Delete role?"
        description="This role will be soft-deleted. It cannot be removed if assigned to users."
        tone="danger"
        confirming={saving && !!deleteId}
        confirmText={saving && deleteId ? "Deleting…" : "Delete"}
        onCancel={() => !saving && setDeleteId(null)}
        onConfirm={confirmDelete}
      />
    </DashboardLayout>
  );
}
