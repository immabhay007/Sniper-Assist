import { useCallback, useEffect, useState } from "react";
import DashboardLayout from "@/layout/DashboardLayout";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import SelectInput from "@/components/common/SelectInput";
import MenuCard from "@/components/menus/MenuCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { menuService } from "@/services/menuService";
import { getApiErrorMessage } from "@/utils/apiError";
import { toast } from "@/utils/toast";
import { useAuth } from "@/context/AuthContext";
import { can } from "@/utils/permissions";
import { HiOutlineViewGrid } from "react-icons/hi";
import { useFilteredRows } from "@/hooks/useFilteredRows";
import { MENU_SEARCH_FIELDS } from "@/utils/pageSearchFilter";

export default function MenusList() {
  const { user } = useAuth();
  const canView = can(user, "menus", "can_view");
  const canCreate = can(user, "menus", "can_create");
  const canEdit = can(user, "menus", "can_edit");
  const canDelete = can(user, "menus", "can_delete");

  const [menus, setMenus] = useState([]);
  const [available, setAvailable] = useState([]);
  const [selectedKey, setSelectedKey] = useState("");
  const [tab, setTab] = useState("list");
  const [deleteId, setDeleteId] = useState(null);
  const [toggleTarget, setToggleTarget] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!canView) return;
    setLoading(true);
    try {
      const [registered, avail] = await Promise.all([
        menuService.list({ activeOnly: false }),
        menuService.listAvailable(),
      ]);
      setMenus(registered);
      setAvailable(avail);
      if (avail[0]) setSelectedKey(avail[0].menu_key);
      else setSelectedKey("");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to load menus"));
      setMenus([]);
      setAvailable([]);
    } finally {
      setLoading(false);
    }
  }, [canView]);

  useEffect(() => {
    load();
  }, [load]);

  const filteredMenus = useFilteredRows(menus, MENU_SEARCH_FIELDS);
  const activeMenus = filteredMenus.filter((m) => m.is_active);
  const inactiveMenus = filteredMenus.filter((m) => !m.is_active);

  const submitAdd = async (e) => {
    e.preventDefault();
    if (!canCreate || !selectedKey) return;
    setSaving(true);
    try {
      await menuService.addFromCatalog(selectedKey);
      await load();
      setTab("list");
      toast.success("Menu registered");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to add menu"));
    } finally {
      setSaving(false);
    }
  };

  const confirmToggleActive = async () => {
    if (!canEdit || !toggleTarget) return;
    setSaving(true);
    try {
      await menuService.update(toggleTarget.id, { is_active: !toggleTarget.is_active });
      setToggleTarget(null);
      await load();
      toast.success(toggleTarget.is_active ? "Menu deactivated" : "Menu activated");
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
      await menuService.remove(deleteId);
      setDeleteId(null);
      await load();
      toast.success("Menu removed");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to remove menu"));
    } finally {
      setSaving(false);
    }
  };

  if (!canView) {
    return (
      <DashboardLayout title="Menus" subtitle="Register sidebar features for permissions">
        <div className="sniper-card p-6 text-sm text-muted-foreground">
          You do not have permission to manage menus.
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Menus" subtitle="Add sidebar features to the app menu registry (catalog only)">
      <p className="text-sm text-muted-foreground mb-4">
        Menus can only be chosen from existing application features (sidebar). You cannot create custom menu keys.
      </p>

      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="mb-5">
          <TabsTrigger value="list">Registered ({menus.length})</TabsTrigger>
          {canCreate && (
            <TabsTrigger value="add" disabled={available.length === 0}>
              Add from catalog ({available.length})
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="list">
          <div className="sniper-card p-6">
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : menus.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No menus registered yet. Add items from the catalog tab.
              </p>
            ) : (
              <>
                <h3 className="text-[15px] font-semibold mb-3">Active ({activeMenus.length})</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                  {activeMenus.map((m) => (
                    <MenuCard
                      key={m.id}
                      menu={m}
                      saving={saving}
                      canEdit={canEdit}
                      canDelete={canDelete}
                      onRequestToggle={setToggleTarget}
                      onDelete={setDeleteId}
                    />
                  ))}
                </div>
                {inactiveMenus.length > 0 && (
                  <>
                    <h3 className="text-[15px] font-semibold mb-3 text-muted-foreground">
                      Inactive ({inactiveMenus.length})
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {inactiveMenus.map((m) => (
                        <MenuCard
                          key={m.id}
                          menu={m}
                          inactive
                          saving={saving}
                          canEdit={canEdit}
                          canDelete={canDelete}
                          onRequestToggle={setToggleTarget}
                          onDelete={setDeleteId}
                        />
                      ))}
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </TabsContent>

        {canCreate && (
          <TabsContent value="add">
            <form onSubmit={submitAdd} className="sniper-card p-6 max-w-lg">
              <h3 className="text-[15px] font-semibold mb-4 flex items-center gap-2">
                <HiOutlineViewGrid className="size-5" /> Add menu from catalog
              </h3>
              {available.length === 0 ? (
                <p className="text-sm text-muted-foreground">All catalog menus are already registered.</p>
              ) : (
                <>
                  <SelectInput
                    label="Available feature"
                    required
                    value={selectedKey}
                    onChange={(e) => setSelectedKey(e.target.value)}
                  >
                    {available.map((a) => (
                      <option key={a.menu_key} value={a.menu_key}>
                        {a.menu_name} — {a.route} ({a.group})
                      </option>
                    ))}
                  </SelectInput>
                  <div className="mt-6 flex gap-3">
                    <button type="submit" className="sniper-btn sniper-btn-primary" disabled={saving}>
                      {saving ? "Adding…" : "Register menu"}
                    </button>
                    <button type="button" className="sniper-btn" onClick={() => setTab("list")}>
                      Cancel
                    </button>
                  </div>
                </>
              )}
            </form>
          </TabsContent>
        )}
      </Tabs>

      <ConfirmDialog
        open={!!toggleTarget}
        title={toggleTarget?.is_active ? "Deactivate menu?" : "Activate menu?"}
        description={
          toggleTarget
            ? `"${toggleTarget.menu_name}" will be ${toggleTarget.is_active ? "deactivated" : "activated"} in the registry.`
            : ""
        }
        tone={toggleTarget?.is_active ? "danger" : "primary"}
        confirmText={toggleTarget?.is_active ? "Deactivate" : "Activate"}
        onCancel={() => setToggleTarget(null)}
        onConfirm={confirmToggleActive}
      />

      <ConfirmDialog
        open={!!deleteId}
        title="Remove menu from registry?"
        description="This removes the menu from the registry. Assign permissions again if you re-add it later."
        tone="danger"
        confirmText="Remove"
        onCancel={() => setDeleteId(null)}
        onConfirm={confirmDelete}
      />
    </DashboardLayout>
  );
}
