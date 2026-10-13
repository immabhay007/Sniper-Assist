// src/routes/_app/customers/create.tsx

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useState, useRef } from "react";
import { isAxiosError } from "axios";

import { Card } from "@/components/ui-kit/Card";
import { customerService, type CustomerCreatePayload } from "@/services/customerService";
import { toast } from "@/utils/toast";
import { getApiErrorMessage } from "@/utils/apiError";

export const Route = createFileRoute("/_app/customers/create")({
  component: CreateCustomerPage,
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

function CreateCustomerPage() {
  const navigate = useNavigate();
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

  const isSubmitting = useRef(false);

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
      await customerService.createCustomer(form);
      toast.success("Customer created successfully.");
      navigate({ to: "/customers" });
    } catch (error) {
      const msg = handleApiError(error, "Failed to create customer.");
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
              Back to Customers
            </button>
          </div>
        </div>

        <div className="px-5 py-5">
          <form id="create-customer-form" onSubmit={handleSubmit} className="space-y-4">
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
            form="create-customer-form"
            className="h-10 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground"
            disabled={saving}
          >
            {saving ? "Creating..." : "Create Customer"}
          </button>
        </div>
      </Card>
    </div>
  );
}