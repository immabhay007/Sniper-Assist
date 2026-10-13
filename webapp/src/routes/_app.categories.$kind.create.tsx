import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useState, useRef } from "react";
import { isAxiosError } from "axios";

import { Card } from "@/components/ui-kit/Card";
import { categoryService } from "@/services/categoryService";
import { toast } from "@/utils/toast";
import { getApiErrorMessage } from "@/utils/apiError";
import {
  CATEGORY_ICON_PRESETS,
  CATEGORY_COLOR_PRESETS,
  DEFAULT_CATEGORY_ICON_KEY,
} from "@/config/categoryIcons";

export const Route = createFileRoute("/_app/categories/$kind/create")({
  component: CategoryCreatePage,
});

// Unified error handler – extracts detail and shows ONE toast
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
  return message; // for inline error display
};

type CategoryKind = "enquiry" | "complaint";

type CategoryFormState = {
  category_name: string;
  sla_hours: string;
  icon_key: string;
  color: string;
};

function emptyCategoryForm(): CategoryFormState {
  return {
    category_name: "",
    sla_hours: "",
    icon_key: DEFAULT_CATEGORY_ICON_KEY,
    color: CATEGORY_COLOR_PRESETS[0],
  };
}

function validateForm(form: CategoryFormState) {
  if (!form.category_name.trim()) return "Category name is required";
  if (form.sla_hours.trim() === "") return "SLA Hours is required";
  if (Number.isNaN(Number(form.sla_hours))) return "SLA Hours must be a number";
  return "";
}

function CategoryCreatePage() {
  const { kind } = Route.useParams();
  const navigate = useNavigate();
  const categoryKind: CategoryKind = kind === "complaint" ? "complaint" : "enquiry";

  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState<CategoryFormState>(emptyCategoryForm());

  // Ref to prevent duplicate submissions
  const isSubmitting = useRef(false);

  const goBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      window.history.back();
      return;
    }
    navigate({ to: "/categories" });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting.current) return;
    const validationError = validateForm(form);
    if (validationError) {
      setFormError(validationError);
      return;
    }

    isSubmitting.current = true;
    setSaving(true);
    setFormError("");
    try {
      const payload = {
        category_name: form.category_name,
        sla_hours: Number(form.sla_hours),
        is_active: true,
        category_icon: form.icon_key,
        color_code: form.color,
      };
      if (categoryKind === "enquiry") {
        await categoryService.createEnquiryCategory(payload);
      } else {
        await categoryService.createComplaintCategory(payload);
      }
      console.log("Sending payload:", payload);
      toast.success("Category created successfully.");
      navigate({ to: "/categories" });
    } catch (err) {
      const msg = handleApiError(err, "Failed to create category.");
      setFormError(msg);
    } finally {
      setSaving(false);
      isSubmitting.current = false;
    }
  };

  const handleIconSelect = (iconName: string) => {
    setForm((prev) => ({ ...prev, icon_key: iconName }));
  };

  const handleColorSelect = (color: string) => {
    setForm((prev) => ({ ...prev, color }));
  };

  const SelectedIcon = CATEGORY_ICON_PRESETS.find(
    (p) => p.name === form.icon_key
  )?.Icon;

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
          <div className="flex items-start gap-3">
            <button
              type="button"
              onClick={goBack}
              className="mt-0.5 flex h-9 items-center gap-2 rounded-lg border border-border bg-card px-3 text-sm font-medium text-foreground transition hover:bg-accent"
              aria-label="Back"
            >
              <ArrowLeft className="h-4 w-4" />
              {categoryKind === "enquiry" ? "Back to Category" : "Back to Category"}
            </button>
          </div>
        </div>

        <div className="px-5 py-5">
          <form
            id="create-category-form"
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Category Name *
                </label>
                <input
                  value={form.category_name}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      category_name: e.target.value,
                    }))
                  }
                  className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="Enter category name"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  SLA Hours *
                </label>
                <input
                  type="number"
                  min="0"
                  value={form.sla_hours}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      sla_hours: e.target.value,
                    }))
                  }
                  className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="Enter SLA hours"
                />
              </div>
            </div>

            {/* Color Picker */}
            <div>
              <label className="mb-2 block text-sm font-medium">Category Color</label>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-sm text-muted-foreground">Selected:</span>
                <div
                  className="h-8 w-8 rounded-full border border-border"
                  style={{ backgroundColor: form.color }}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {CATEGORY_COLOR_PRESETS.map((color) => {
                  const isSelected = form.color === color;
                  return (
                    <button
                      key={color}
                      type="button"
                      onClick={() => handleColorSelect(color)}
                      className={`h-8 w-8 rounded-full border-2 transition-all ${
                        isSelected
                          ? "border-primary scale-110"
                          : "border-transparent hover:scale-105"
                      }`}
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  );
                })}
              </div>
            </div>

            {/* Icon Picker */}
            <div>
              <label className="mb-2 block text-sm font-medium">Category Icon</label>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-sm text-muted-foreground">Selected:</span>
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card"
                  style={{ color: form.color }}
                >
                  {SelectedIcon ? <SelectedIcon className="h-5 w-5" /> : null}
                </div>
              </div>
              <div className="max-h-100 overflow-y-auto rounded-lg border border-border p-2">
                <div className="grid grid-cols-6 gap-1 sm:grid-cols-8 md:grid-cols-10">
                  {CATEGORY_ICON_PRESETS.map(({ name, Icon }) => {
                    const isSelected = form.icon_key === name;
                    return (
                      <button
                        key={name}
                        type="button"
                        onClick={() => handleIconSelect(name)}
                        className={`flex h-10 w-10 items-center justify-center rounded-md border transition-colors ${
                          isSelected
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border bg-card hover:bg-accent"
                        }`}
                        title={name}
                      >
                        <Icon className="h-5 w-5" />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {formError ? (
              <p className="text-sm text-danger">{formError}</p>
            ) : null}
          </form>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-4">
          <button
            type="button"
            onClick={goBack}
            className="h-10 rounded-lg border border-border bg-card px-4 text-sm font-medium text-foreground transition hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
            disabled={saving}
          >
            Cancel
          </button>
          <button
            type="submit"
            form="create-category-form"
            className="h-10 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={saving}
          >
            {saving ? "Saving..." : "Add Category"}
          </button>
        </div>
      </Card>
    </div>
  );
}