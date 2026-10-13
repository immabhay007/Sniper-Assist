import { createFileRoute, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { Card } from "@/components/ui-kit/Card";
import { Chip } from "@/components/ui-kit/Chip";
import { ArrowLeft, Pencil, Plus, Trash2, X } from "lucide-react";
import { useEffect, useState, useRef, useMemo } from "react";
import { categoryService } from "@/services/categoryService";
import { toast } from "@/utils/toast";
import { getApiErrorMessage } from "@/utils/apiError";
import { getCategoryIcon } from "@/config/categoryIcons";
import { usePageSearch } from "@/context/PageSearchContext";

export const Route = createFileRoute("/_app/categories")({
  component: CategoriesPage,
});

type CategorySummary = {
  id: number;
  category_name: string;
  sla_hours: number;
  is_active: boolean;
  category_icon?: string;
  color_code?: string;
};

type CategoryFormState = {
  category_name: string;
  sla_hours: string;
};

function emptyCategoryForm(): CategoryFormState {
  return {
    category_name: "",
    sla_hours: "",
  };
}

const CARD_BACKGROUNDS = [
  "bg-warning-soft",
  "bg-info-soft",
  "bg-primary-soft",
  "bg-success-soft",
];

function CategoriesPage() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const [tab, setTab] = useState<"enquiry" | "complaint">("enquiry");
  const [enquiryCategories, setEnquiryCategories] = useState<CategorySummary[]>([]);
  const [complaintCategories, setComplaintCategories] = useState<CategorySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<CategorySummary | null>(null);
  const [addForm, setAddForm] = useState<CategoryFormState>(emptyCategoryForm());
  const [editForm, setEditForm] = useState<CategoryFormState>(emptyCategoryForm());
  const [formError, setFormError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<CategorySummary | null>(null);
  const [deleteSaving, setDeleteSaving] = useState(false);

  const isFirstPathRef = useRef(true);
  const { query, setResultCount } = usePageSearch();
  const searchTerm = query.trim().toLowerCase();

  // --- Data loading ---
  async function loadCategories() {
    setLoading(true);
    setError("");
    try {
      const [enquiryData, complaintData] = await Promise.all([
        categoryService.listEnquiryCategories(),
        categoryService.listComplaintCategories(),
      ]);
      setEnquiryCategories(Array.isArray(enquiryData) ? enquiryData : []);
      setComplaintCategories(Array.isArray(complaintData) ? complaintData : []);
    } catch {
      setEnquiryCategories([]);
      setComplaintCategories([]);
      setError("Failed to load categories.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadCategories();
  }, []);

  useEffect(() => {
    if (pathname === "/categories") {
      if (isFirstPathRef.current) {
        isFirstPathRef.current = false;
        return;
      }
      loadCategories();
    }
  }, [pathname]);

  // --- Derived data (after state definitions) ---
  const currentCategories = tab === "enquiry" ? enquiryCategories : complaintCategories;

  const filteredCategories = useMemo(() => {
    if (!searchTerm) return currentCategories;
    return currentCategories.filter((cat) =>
      cat.category_name.toLowerCase().includes(searchTerm)
    );
  }, [currentCategories, searchTerm]);

  // Update match count in header
  useEffect(() => {
    setResultCount(filteredCategories.length);
  }, [filteredCategories, setResultCount]);

  // --- Form handlers (unchanged) ---
  function resetFormState() {
    setFormError("");
    setAddForm(emptyCategoryForm());
    setEditForm(emptyCategoryForm());
  }

  function validateForm(form: CategoryFormState) {
    if (!form.category_name.trim()) return "Category name is required";
    if (form.sla_hours.trim() === "") return "SLA Hours is required";
    if (Number.isNaN(Number(form.sla_hours))) return "SLA Hours must be a number";
    return "";
  }

  async function handleAddSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const validationError = validateForm(addForm);
    if (validationError) {
      setFormError(validationError);
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      const payload = { ...addForm, is_active: true };
      if (tab === "enquiry") {
        await categoryService.createEnquiryCategory(payload);
      } else {
        await categoryService.createComplaintCategory(payload);
      }
      setIsAddOpen(false);
      resetFormState();
      await loadCategories();
      toast.success("Category created successfully.");
    } catch (err) {
      setFormError(getApiErrorMessage(err, "Failed to create category."));
    } finally {
      setSaving(false);
    }
  }

  async function handleEditSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editTarget) return;
    const validationError = validateForm(editForm);
    if (validationError) {
      setFormError(validationError);
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      const payload = { ...editForm, is_active: editTarget.is_active };
      if (tab === "enquiry") {
        await categoryService.updateEnquiryCategory(editTarget.id, payload);
      } else {
        await categoryService.updateComplaintCategory(editTarget.id, payload);
      }
      setEditTarget(null);
      resetFormState();
      await loadCategories();
      toast.success("Category updated successfully.");
    } catch (err) {
      setFormError(getApiErrorMessage(err, "Failed to update category."));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleteSaving(true);
    try {
      if (tab === "enquiry") {
        await categoryService.deleteEnquiryCategory(deleteTarget.id);
      } else {
        await categoryService.deleteComplaintCategory(deleteTarget.id);
      }
      setDeleteTarget(null);
      await loadCategories();
      toast.success("Category deleted successfully.");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to delete category."));
    } finally {
      setDeleteSaving(false);
    }
  }

  // --- Render ---
  if (pathname !== "/categories") {
    return <Outlet />;
  }

  return (
    <div className="space-y-6">
      {/* Tabs & Add Button */}
      <div className="flex items-center justify-between gap-3">
        <div className="inline-flex rounded-xl bg-muted p-1">
          {(["enquiry", "complaint"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                tab === t ? "bg-card text-foreground shadow-card" : "text-muted-foreground"
              }`}
            >
              {t === "enquiry" ? "Enquiry Category" : "Complaint Category"}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => {
            navigate({ to: "/categories/$kind/create", params: { kind: tab } });
          }}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> Add Category
        </button>
      </div>

      {/* Category List Card */}
      <Card>
        <div className="px-6 pt-5 pb-2 text-sm font-semibold">
          {tab === "enquiry" ? "Enquiry Category" : "Complaint Category"} ({filteredCategories.length})
        </div>

        {loading ? (
          <div className="px-5 pb-6 text-sm text-muted-foreground">Loading categories...</div>
        ) : error ? (
          <div className="px-5 pb-6 text-sm text-danger">{error}</div>
        ) : filteredCategories.length === 0 ? (
          <div className="px-5 pb-6 text-sm text-muted-foreground">
            {searchTerm ? "No categories match your search." : "No categories found."}
          </div>
        ) : (
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            {filteredCategories.map((category, index) => {
              const bg = CARD_BACKGROUNDS[index % CARD_BACKGROUNDS.length];
              const Icon = getCategoryIcon(category.category_icon);
              const color = category.color_code || "#7c6ce0";

              return (
                <div key={`${tab}-${category.id}`} className={`flex items-center justify-between gap-4 rounded-xl ${bg} p-4`}>
                  <div className="min-w-0 flex items-center gap-3">
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full" style={{ color }}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate font-semibold">{category.category_name}</p>
                        <Chip tone={category.is_active ? "success" : "muted"}>
                          {category.is_active ? "Active" : "Inactive"}
                        </Chip>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">SLA Hours: {category.sla_hours}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        navigate({
                          to: "/categories/$kind/$categoryId/edit",
                          params: { kind: tab, categoryId: String(category.id) },
                        })
                      }
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:text-primary"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(category)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-danger hover:bg-danger-soft"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Modals (unchanged) */}
      <CategoryActionModal
        open={isAddOpen}
        title={`Add ${tab === "enquiry" ? "Enquiry" : "Complaint"} Category`}
        description="Create a new category"
        formId="add-category-form"
        submitLabel={saving ? "Saving..." : "Add Category"}
        saving={saving}
        onClose={() => {
          if (saving) return;
          setIsAddOpen(false);
          resetFormState();
        }}
      >
        <form id="add-category-form" onSubmit={handleAddSubmit} className="space-y-4">
          <CategoryModalFields form={addForm} setForm={setAddForm} error={formError} />
        </form>
      </CategoryActionModal>

      <CategoryActionModal
        open={!!editTarget}
        title={`Edit ${tab === "enquiry" ? "Enquiry" : "Complaint"} Category`}
        description="Update category details"
        formId="edit-category-form"
        submitLabel={saving ? "Saving..." : "Save Changes"}
        saving={saving}
        onClose={() => {
          if (saving) return;
          setEditTarget(null);
          resetFormState();
        }}
      >
        <form id="edit-category-form" onSubmit={handleEditSubmit} className="space-y-4">
          <CategoryModalFields form={editForm} setForm={setEditForm} error={formError} />
        </form>
      </CategoryActionModal>

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md">
            <Card>
              <div className="flex items-start justify-between border-b border-border px-5 py-4">
                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      if (deleteSaving) return;
                      setDeleteTarget(null);
                    }}
                    className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition hover:bg-accent"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">Delete Category</h2>
                    <p className="text-sm text-muted-foreground">
                      Are you sure you want to delete{" "}
                      <span className="font-medium">{deleteTarget.category_name}</span>?
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (deleteSaving) return;
                    setDeleteTarget(null);
                  }}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-4">
                <button
                  type="button"
                  onClick={() => {
                    if (deleteSaving) return;
                    setDeleteTarget(null);
                  }}
                  className="h-10 rounded-lg border border-border bg-card px-4 text-sm font-medium"
                  disabled={deleteSaving}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void handleDelete()}
                  disabled={deleteSaving}
                  className="h-10 rounded-lg bg-danger px-5 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {deleteSaving ? "Deleting..." : "Delete"}
                </button>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

// ---- Helper Components ----
function CategoryModalFields({
  form,
  setForm,
  error,
}: {
  form: CategoryFormState;
  setForm: React.Dispatch<React.SetStateAction<CategoryFormState>>;
  error: string;
}) {
  return (
    <>
      <div>
        <label className="mb-1 block text-sm font-medium">Category name</label>
        <input
          value={form.category_name}
          onChange={(e) => setForm((prev) => ({ ...prev, category_name: e.target.value }))}
          className="w-full rounded-lg border border-input bg-card px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          placeholder="Enter category name"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">SLA Hours</label>
        <input
          type="number"
          min="0"
          value={form.sla_hours}
          onChange={(e) => setForm((prev) => ({ ...prev, sla_hours: e.target.value }))}
          className="w-full rounded-lg border border-input bg-card px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          placeholder="Enter SLA hours"
        />
      </div>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
    </>
  );
}

function CategoryActionModal({
  open,
  title,
  description,
  formId,
  submitLabel,
  saving,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  description: string;
  formId: string;
  submitLabel: string;
  saving: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-background/70 p-4 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-4xl animate-in fade-in zoom-in-95 duration-200">
        <Card>
          <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
            <div className="flex items-start gap-3">
              <button
                type="button"
                onClick={onClose}
                className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition hover:bg-accent"
                aria-label="Back"
                disabled={saving}
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <div>
                <h2 className="font-display text-lg font-semibold text-foreground">{title}</h2>
                <p className="text-sm text-muted-foreground">{description}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-accent"
              aria-label="Close"
              disabled={saving}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="px-5 py-5">{children}</div>

          <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-4">
            <button
              type="button"
              onClick={onClose}
              className="h-10 rounded-lg border border-border bg-card px-4 text-sm font-medium text-foreground transition hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              form={formId}
              className="h-10 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={saving}
            >
              {submitLabel}
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}