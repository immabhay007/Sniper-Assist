import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { isAxiosError } from "axios";

import { Card } from "@/components/ui-kit/Card";
import { toast } from "@/utils/toast";
import { getApiErrorMessage } from "@/utils/apiError";
import api from "@/config/axios";

export const Route = createFileRoute("/_app/user/$userId/edit")({
  component: EditUserPage,
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
  return message;
};

function EditUserPage() {
  const { userId } = Route.useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
  });

  // Refs to prevent duplicate API calls and submissions
  const isFetching = useRef(false);
  const isSubmitting = useRef(false);

  const goBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      window.history.back();
      return;
    }
    navigate({ to: "/teams" });
  };

  useEffect(() => {
    const loadUser = async () => {
      if (isFetching.current) return;
      isFetching.current = true;
      try {
        setLoading(true);
        setError("");

        const { data } = await api.get(`/users/${userId}`);

        setForm({
          full_name: data?.full_name ?? "",
          email: data?.email ?? "",
          phone: data?.phone ?? "",
        });
      } catch (err) {
        const msg = handleApiError(err, "Failed to load user.");
        setError(msg);
      } finally {
        setLoading(false);
        isFetching.current = false;
      }
    };

    if (userId) {
      void loadUser();
    } else {
      setLoading(false);
      const msg = "User ID not found.";
      setError(msg);
      toast.error(msg);
    }
  }, [userId]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting.current) return;

    if (!form.full_name.trim() || !form.email.trim()) {
      setFormError("Full Name and Email are required.");
      return;
    }

    isSubmitting.current = true;
    setFormError("");
    setSaving(true);

    try {
      await api.patch(`/users/${userId}`, {
        email: form.email.trim(),
        full_name: form.full_name.trim(),
        phone: form.phone.trim(),
      });

      toast.success("User updated successfully.");
      navigate({ to: "/teams" });
    } catch (err) {
      const msg = handleApiError(err, "Failed to update user.");
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
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Teams
            </button>
          </div>
        </div>

        <div className="px-5 py-5">
          {loading ? (
            <div className="text-sm text-muted-foreground">
              Loading user details...
            </div>
          ) : error ? (
            <div className="text-sm text-danger">{error}</div>
          ) : (
            <form
              id="edit-user-form"
              onSubmit={handleSubmit}
              className="grid grid-cols-1 gap-4 md:grid-cols-2"
            >
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">
                  Full Name *
                </label>

                <input
                  type="text"
                  value={form.full_name}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
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
                    setForm((prev) => ({
                      ...prev,
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
                    setForm((prev) => ({
                      ...prev,
                      phone: e.target.value,
                    }))
                  }
                  className="h-10 w-full rounded-lg border border-input px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="Enter phone number"
                />
              </div>

              {formError && (
                <p className="text-sm text-danger md:col-span-2">
                  {formError}
                </p>
              )}
            </form>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-4">
          <button
            type="button"
            onClick={goBack}
            disabled={saving}
            className="h-10 rounded-lg border border-border bg-card px-4 text-sm font-medium text-foreground transition hover:bg-accent"
          >
            Cancel
          </button>

          <button
            type="submit"
            form="edit-user-form"
            disabled={loading || saving}
            className="h-10 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Updating..." : "Update User"}
          </button>
        </div>
      </Card>
    </div>
  );
}

export default EditUserPage;