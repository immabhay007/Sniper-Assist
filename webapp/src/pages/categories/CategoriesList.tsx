import { useCallback, useEffect, useState } from "react";
import DashboardLayout from "@/layout/DashboardLayout";
import Modal from "@/components/common/Modal";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import CategoryFormFields from "@/components/categories/CategoryFormFields";
import CategoryRow from "@/components/categories/CategoryRow";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { categoryService } from "@/services/categoryService";
import { CATEGORY_COLOR_PRESETS } from "@/config/categoryIcons";
import { getApiErrorMessage } from "@/utils/apiError";
import { toast } from "@/utils/toast";
import { useFilteredRows } from "@/hooks/useFilteredRows";
import { CATEGORY_SEARCH_FIELDS } from "@/utils/pageSearchFilter";

const emptyForm = () => ({
  category_name: "",
  category_type: "Recurring",
  monthly_budget: "",
  color_code: CATEGORY_COLOR_PRESETS[0],
  icon: "HiOutlineDotsCircleHorizontal",
});

export default function CategoriesList() {
  const [cats, setCats] = useState([]);
  const [tab, setTab] = useState("list");
  const [addForm, setAddForm] = useState(emptyForm());
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState(emptyForm());
  const [deleteId, setDeleteId] = useState(null);
  const [toggleTarget, setToggleTarget] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setCats(await categoryService.list({ activeOnly: false }));
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to load categories"));
      setCats([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filteredCats = useFilteredRows(cats, CATEGORY_SEARCH_FIELDS);
  const activeCats = filteredCats.filter((c) => c.is_active);
  const inactiveCats = filteredCats.filter((c) => !c.is_active);

  const submitAdd = async (e) => {
    e.preventDefault();
    if (!addForm.category_name?.trim() || !addForm.icon) return;
    setSaving(true);
    try {
      await categoryService.create(addForm);
      setAddForm(emptyForm());
      await load();
      setTab("list");
      toast.success("Category created");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to create category"));
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (c) => {
    setEditId(c.id);
    setEditForm({
      category_name: c.category_name,
      category_type: c.category_type || "Variable",
      monthly_budget: c.monthly_budget ?? "",
      color_code: c.color_code || CATEGORY_COLOR_PRESETS[0],
      icon: c.icon ?? c.category_icon,
    });
  };

  const submitEdit = async (e) => {
    e.preventDefault();
    if (!editId || !editForm.category_name?.trim()) return;
    setSaving(true);
    try {
      await categoryService.update(editId, editForm);
      setEditId(null);
      await load();
      toast.success("Category updated");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to update category"));
    } finally {
      setSaving(false);
    }
  };

  const confirmToggleActive = async () => {
    if (!toggleTarget) return;
    setSaving(true);
    try {
      await categoryService.update(toggleTarget.id, { is_active: !toggleTarget.is_active });
      setToggleTarget(null);
      await load();
      toast.success(toggleTarget.is_active ? "Category deactivated" : "Category activated");
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
      await categoryService.remove(deleteId);
      setDeleteId(null);
      await load();
      toast.success("Category deleted");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to delete category"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout title="Categories" subtitle="Group expenses for budgets and reports">
      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="mb-5">
          <TabsTrigger value="list">Active categories</TabsTrigger>
          <TabsTrigger value="add">Add category</TabsTrigger>
        </TabsList>

        <TabsContent value="list">
          <div className="sniper-card p-6">
            <h3 className="text-[15px] font-semibold mb-4">Active categories ({activeCats.length})</h3>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading categories…</p>
            ) : activeCats.length === 0 && inactiveCats.length === 0 ? (
              <p className="text-sm text-muted-foreground">No categories yet. Add one in the Add category tab.</p>
            ) : activeCats.length === 0 ? (
              <p className="text-sm text-muted-foreground">No active categories. Add one in the Add category tab.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {activeCats.map((c) => (
                  <CategoryRow
                    key={c.id}
                    c={c}
                    saving={saving}
                    toggling={saving && toggleTarget?.id === c.id}
                    deleting={saving && deleteId === c.id}
                    onEdit={openEdit}
                    onRequestToggle={setToggleTarget}
                    onDelete={setDeleteId}
                  />
                ))}
              </div>
            )}

            {inactiveCats.length > 0 && (
              <>
                <h3 className="text-[15px] font-semibold mt-8 mb-4 text-muted-foreground">
                  Inactive ({inactiveCats.length})
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {inactiveCats.map((c) => (
                    <CategoryRow
                      key={c.id}
                      c={c}
                      inactive
                      saving={saving}
                      toggling={saving && toggleTarget?.id === c.id}
                      deleting={saving && deleteId === c.id}
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

        <TabsContent value="add">
          <form onSubmit={submitAdd} className="sniper-card p-6 max-w-3xl">
            <h3 className="text-[15px] font-semibold mb-4">New category</h3>
            <CategoryFormFields form={addForm} setForm={setAddForm} />
            <div className="mt-6 flex gap-3">
              <button type="submit" className="sniper-btn sniper-btn-primary" disabled={saving}>
                {saving ? "Saving…" : "Save category"}
              </button>
              <button type="button" className="sniper-btn" onClick={() => setTab("list")}>
                Cancel
              </button>
            </div>
          </form>
        </TabsContent>
      </Tabs>

      <Modal open={!!editId} onClose={() => setEditId(null)} title="Edit category" size="lg">
        <form onSubmit={submitEdit} className="flex min-h-0 flex-col">
          <CategoryFormFields form={editForm} setForm={setEditForm} />
          <div className="sticky -bottom-5 -mx-5 -mb-5 mt-6 flex shrink-0 justify-end gap-2 border-t border-border bg-card px-5 py-4">
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
        title={toggleTarget?.is_active ? "Deactivate category?" : "Activate category?"}
        description={
          toggleTarget
            ? toggleTarget.is_active
              ? `"${toggleTarget.category_name}" will be hidden from active lists. You can activate it again later.`
              : `"${toggleTarget.category_name}" will be marked active and available across the app.`
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
        title="Delete category?"
        description="This category will be soft-deleted and hidden from active lists."
        tone="danger"
        confirming={saving && !!deleteId}
        confirmText={saving && deleteId ? "Deleting…" : "Delete"}
        onCancel={() => !saving && setDeleteId(null)}
        onConfirm={confirmDelete}
      />
    </DashboardLayout>
  );
}
