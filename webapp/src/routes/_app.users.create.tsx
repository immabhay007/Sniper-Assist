import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { isAxiosError } from "axios";

import { Card } from "@/components/ui-kit/Card";
import { userService } from "@/services/userService";
import { toast } from "@/utils/toast";
import { getApiErrorMessage } from "@/utils/apiError";
import api from "@/config/axios";

const ROLE_OPTIONS = ["admin", "officer"];

export const Route = createFileRoute("/_app/users/create")({
  component: UserCreatePage,
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

function UserCreatePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    role: "",
    password: "",
  });

  // Ref to prevent duplicate submissions
  const isSubmitting = useRef(false);

  const goBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      window.history.back();
      return;
    }
    navigate({ to: "/enquiries" });
  };

  useEffect(() => {
    setLoading(false);
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting.current) return;

    if (
      !form.full_name.trim() ||
      !form.email.trim() ||
      !form.role.trim() ||
      !form.password.trim()
    ) {
      setFormError("Please fill all required fields.");
      return;
    }

    isSubmitting.current = true;
    setFormError("");
    setSaving(true);

    try {
      const payload = {
        email: form.email.trim(),
        full_name: form.full_name.trim(),
        phone: form.phone.trim(),
        role: form.role,
        password: form.password,
        is_active: 1,
        is_deleted: 0,
        created_at: new Date().toISOString(),
      };

      await api.post("/users", payload);

      toast.success("User created successfully.");
      navigate({ to: "/teams" });
    } catch (error) {
      const msg = handleApiError(error, "Failed to create user.");
      setFormError(msg);
    } finally {
      setSaving(false);
      isSubmitting.current = false;
    }
  };

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
              Back to User
            </button>
          </div>
        </div>

        <div className="px-5 py-5">
          {loading ? (
            <div className="text-sm text-muted-foreground">
              Loading form options...
            </div>
          ) : (
            <form
              id="create-user-form"
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">
                    Full Name *
                  </label>

                  <input
                    type="text"
                    value={form.full_name}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        full_name: e.target.value,
                      }))
                    }
                    className="h-10 w-full rounded-lg border border-input px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="Enter full name"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">
                    Email *
                  </label>

                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        email: e.target.value,
                      }))
                    }
                    className="h-10 w-full rounded-lg border border-input px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="Enter email"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">
                    Phone
                  </label>

                  <input
                    type="text"
                    value={form.phone}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        phone: e.target.value,
                      }))
                    }
                    className="h-10 w-full rounded-lg border border-input px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="Enter phone number"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">
                    Role *
                  </label>

                  <select
                    value={form.role}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        role: e.target.value,
                      }))
                    }
                    className="h-10 w-full rounded-lg border border-input px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    {ROLE_OPTIONS.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">
                    Password *
                  </label>

                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        password: e.target.value,
                      }))
                    }
                    className="h-10 w-full rounded-lg border border-input px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="Enter password"
                  />
                </div>
              </div>
              {formError && (
                <p className="text-sm text-danger">{formError}</p>
              )}
            </form>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-4">
          <button
            type="button"
            onClick={goBack}
            className="h-10 rounded-lg border border-border bg-card px-4 text-sm font-medium"
            disabled={saving}
          >
            Cancel
          </button>

          <button
            type="submit"
            form="create-user-form"
            className="h-10 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground"
            disabled={saving}
          >
            {saving ? "Creating..." : "Create user"}
          </button>
        </div>
      </Card>
    </div>
  );
}