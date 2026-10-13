// src/routes/_app/customers/edit/$id.tsx (or you can reuse create.tsx with a shared component)
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { isAxiosError } from "axios";

import { Card } from "@/components/ui-kit/Card";
import {
  customerService,
  type CustomerCreatePayload,
  type CustomerUpdatePayload,
} from "@/services/customerService";
import { toast } from "@/utils/toast";
import { getApiErrorMessage } from "@/utils/apiError";

export const Route = createFileRoute("/_app/customers/edit/$id")({
  component: CustomerFormPage,
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

function CustomerFormPage() {
  const navigate = useNavigate();
  const { id } = Route.useParams();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [form, setForm] = useState<CustomerCreatePayload>({
    full_name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    is_new_customer: true,
    is_active: true,
    is_deleted: false,
  });

  // Refs to prevent duplicate API calls and submissions
  const isFetching = useRef(false);
  const isSubmitting = useRef(false);

  // Fetch customer data when editing
  useEffect(() => {
    if (!isEdit) return;
    const fetchCustomer = async () => {
      if (isFetching.current) return;
      isFetching.current = true;
      try {
        setLoading(true);
        const data = await customerService.getCustomerById(Number(id));
        setForm({
          full_name: data.full_name,
          email: data.email,
          phone: data.phone ?? "",
          address: data.address ?? "",
          city: data.city ?? "",
          state: data.state ?? "",
          is_new_customer: data.is_new_customer,
          is_active: data.is_active,
          is_deleted: data.is_deleted,
        });
      } catch (error) {
        const msg = handleApiError(error, "Failed to load customer.");
        setFormError(msg);
      } finally {
        setLoading(false);
        isFetching.current = false;
      }
    };
    fetchCustomer();
  }, [id, isEdit]);

  const goBack = () => {
    navigate({ to: "/customers" });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting.current) return;

    if (!form.full_name.trim() || !form.email.trim()) {
      setFormError("Full name and email are required.");
      return;
    }

    isSubmitting.current = true;
    setFormError("");
    setSaving(true);

    try {
      if (isEdit) {
        await customerService.updateCustomer(Number(id), form);
        toast.success("Customer updated successfully.");
      } else {
        await customerService.createCustomer(form);
        toast.success("Customer created successfully.");
      }
      navigate({ to: "/customers" });
    } catch (error) {
      const msg = handleApiError(error, "Operation failed.");
      setFormError(msg);
    } finally {
      setSaving(false);
      isSubmitting.current = false;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">Loading customer…</p>
        </div>
      </div>
    );
  }

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
              Back to Customers
            </button>
          </div>
        </div>

        <div className="px-5 py-5">
          <form id="customer-form" onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Full Name *</label>
                <input
                  type="text"
                  value={form.full_name}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, full_name: e.target.value }))
                  }
                  className="h-10 w-full rounded-lg border border-input px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="Enter full name"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Email *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, email: e.target.value }))
                  }
                  className="h-10 w-full rounded-lg border border-input px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="Enter email"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Phone</label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, phone: e.target.value }))
                  }
                  className="h-10 w-full rounded-lg border border-input px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="Enter phone number"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Address</label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, address: e.target.value }))
                  }
                  className="h-10 w-full rounded-lg border border-input px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="Street address"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">City</label>
                <input
                  type="text"
                  value={form.city}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, city: e.target.value }))
                  }
                  className="h-10 w-full rounded-lg border border-input px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="City"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">State</label>
                <input
                  type="text"
                  value={form.state}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, state: e.target.value }))
                  }
                  className="h-10 w-full rounded-lg border border-input px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="State"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-6">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, is_active: e.target.checked }))
                  }
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                />
                Active
              </label>
            </div>

            {formError && <p className="text-sm text-danger">{formError}</p>}
          </form>
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
            form="customer-form"
            className="h-10 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground"
            disabled={saving}
          >
            {saving
              ? isEdit
                ? "Updating..."
                : "Creating..."
              : isEdit
                ? "Update Customer"
                : "Create Customer"}
          </button>
        </div>
      </Card>
    </div>
  );
}