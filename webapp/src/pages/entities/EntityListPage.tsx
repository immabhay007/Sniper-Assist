import { useCallback, useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/layout/DashboardLayout";
import Modal from "@/components/common/Modal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import EntityCard from "@/components/entities/EntityCard";
import EntityFormFields from "@/components/entities/EntityFormFields";
import { entityService } from "@/services/entityService";
import { toast } from "@/utils/toast";
import { getApiErrorMessage } from "@/utils/apiError";

const emptyForm = () => ({
  entity_name: "",
  entity_code: "",
  description: "",
  priority: 1,
  is_active: true,
});

export default function EntityListPage() {
  const [items, setItems] = useState<any[]>([]);
  const [tab, setTab] = useState("list");
  const [addForm, setAddForm] = useState(emptyForm());
  const [editId, setEditId] = useState<string | number | null>(null);
  const [editForm, setEditForm] = useState(emptyForm());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await entityService.list());
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to load entities"));
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const canSubmitAdd =
    !!addForm.entity_name?.trim() && !!addForm.entity_code?.trim() && Number.isFinite(Number(addForm.priority));

  const canSubmitEdit =
    !!editForm.entity_name?.trim() &&
    !!editForm.entity_code?.trim() &&
    Number.isFinite(Number(editForm.priority));

  const submitAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canSubmitAdd) return;

    setSaving(true);
    try {
      await entityService.create(addForm);
      setAddForm(emptyForm());
      await load();
      setTab("list");
      toast.success("Entity created");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to create entity"));
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (item: any) => {
    setEditId(item.id);
    setEditForm({
      entity_name: item.entity_name || "",
      entity_code: item.entity_code || "",
      description: item.description || "",
      priority: item.priority ?? 1,
      is_active: item.is_active !== false,
    });
  };

  const submitEdit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editId || !canSubmitEdit) return;

    const current = items.find((row) => row.id === editId);
    const patch: Record<string, any> = {};

    if ((current?.entity_name || "") !== editForm.entity_name) patch.entity_name = editForm.entity_name;
    if ((current?.entity_code || "") !== editForm.entity_code) patch.entity_code = editForm.entity_code;
    if ((current?.description || "") !== editForm.description) patch.description = editForm.description;
    if (Number(current?.priority ?? 1) !== Number(editForm.priority)) patch.priority = Number(editForm.priority);
    if (Boolean(current?.is_active !== false) !== Boolean(editForm.is_active)) patch.is_active = editForm.is_active;

    setSaving(true);
    try {
      await entityService.update(editId, patch);
      setEditId(null);
      await load();
      toast.success("Entity updated");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to update entity"));
    } finally {
      setSaving(false);
    }
  };

  const listItems = useMemo(() => items || [], [items]);

  return (
    <DashboardLayout title="Entity Management" subtitle="Add and edit entities with a consistent UX pattern">
      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="mb-5">
          <TabsTrigger value="list">List</TabsTrigger>
          <TabsTrigger value="add">Add</TabsTrigger>
        </TabsList>

        <TabsContent value="list">
          <section className="sniper-card rounded-xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md">
            <h3 className="mb-4 text-[15px] font-semibold">Entities ({listItems.length})</h3>

            {loading ? (
              <p className="text-sm text-muted-foreground">Loading entities…</p>
            ) : listItems.length === 0 ? (
              <p className="text-sm text-muted-foreground">No entities found. Use the Add tab to create one.</p>
            ) : (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {listItems.map((item) => (
                  <EntityCard key={item.id} item={item} saving={saving} onEdit={openEdit} />
                ))}
              </div>
            )}
          </section>
        </TabsContent>

        <TabsContent value="add">
          <form
            onSubmit={submitAdd}
            className="sniper-card rounded-xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
          >
            <h3 className="mb-4 text-[15px] font-semibold">Add Entity</h3>
            <EntityFormFields form={addForm} setForm={setAddForm} />

            <div className="mt-6 flex items-center gap-3">
              <button
                type="submit"
                disabled={saving || !canSubmitAdd}
                className="sniper-btn sniper-btn-primary rounded-lg border border-primary bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
              >
                {saving ? "Creating…" : "Create Entity"}
              </button>
              <button
                type="button"
                className="sniper-btn rounded-lg border border-input bg-surface px-4 py-2 text-sm"
                onClick={() => setTab("list")}
                disabled={saving}
              >
                Cancel
              </button>
            </div>
          </form>
        </TabsContent>
      </Tabs>

      <Modal
        open={!!editId}
        onClose={() => {
          if (!saving) setEditId(null);
        }}
        title="Edit Entity"
        size="lg"
      >
        <form onSubmit={submitEdit} className="flex min-h-0 flex-col">
          <EntityFormFields form={editForm} setForm={setEditForm} />

          <div className="sticky -bottom-5 -mx-5 -mb-5 mt-6 flex shrink-0 justify-end gap-2 border-t border-border bg-card px-5 py-4">
            <button
              type="button"
              className="sniper-btn rounded-lg border border-input bg-surface px-4 py-2 text-sm"
              onClick={() => setEditId(null)}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !canSubmitEdit}
              className="sniper-btn sniper-btn-primary rounded-lg border border-primary bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
