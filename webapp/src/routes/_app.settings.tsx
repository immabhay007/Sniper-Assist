import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { Card } from "@/components/ui-kit/Card";
import {
  settingService,
  type SettingUser,
} from "@/services/settingService";
import { toast } from "@/utils/toast";
import { isAxiosError } from "axios";

export const Route = createFileRoute("/_app/settings")({
  component: SettingsPage,
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

function SettingsPage() {
  const [user, setUser] = useState<SettingUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);

  // Ref to prevent duplicate API calls (strict mode double mount)
  const isFetching = useRef(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    if (isFetching.current) return;
    isFetching.current = true;
    try {
      setLoading(true);
      const response = await settingService.getSettings();
      console.log("SETTINGS USER RESPONSE", response);
      setUser(response);
      if (response) {
        setFullName(response.full_name || "");
        setEmail(response.email || "");
        setPhone(response.phone || "");
      }
    } catch (error) {
      console.error("Failed to fetch settings", error);
      handleApiError(error, "Failed to load profile settings.");
    } finally {
      setLoading(false);
      isFetching.current = false;
    }
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      await settingService.updateProfile({
        full_name: fullName,
        email,
        phone,
      });
      toast.success("Profile updated successfully.");
      // Refresh data after save
      await fetchSettings();
    } catch (error) {
      console.error("Failed to update profile", error);
      handleApiError(error, "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <div className="space-y-4 p-6">
            <p
              className="font-display text-lg font-semibold"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Profile
            </p>

            {loading ? (
              <div className="py-10 text-center text-sm text-muted-foreground">
                Loading profile...
              </div>
            ) : (
              <>
                <Field
                  label="Full name"
                  value={fullName}
                  onChange={setFullName}
                  required
                />

                <Field
                  label="Email"
                  value={email}
                  onChange={setEmail}
                  required
                />

                <Field
                  label="Phone"
                  value={phone}
                  onChange={setPhone}
                />

                <button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save profile"}
                </button>
              </>
            )}
          </div>
        </Card>

        <Card>
          <div className="space-y-4 p-6">
            <p
              className="font-display text-lg font-semibold"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Application
            </p>

            {[
              ["App name", "Sniper Assist"],
              ["Environment", "development"],
              ["Version", "1.0.0"],
              ["Currency", "INR"],
              ["Date format", "DD/MM/YYYY"],
            ].map(([k, v]) => (
              <div
                key={k}
                className="flex items-center justify-between border-b border-border pb-3 last:border-0 last:pb-0"
              >
                <span className="text-sm text-muted-foreground">
                  {k}
                </span>

                <span className="text-sm font-medium">
                  {v}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <div className="p-6">
          <p
            className="mb-4 font-display text-lg font-semibold"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Theme preview
          </p>

          <div className="flex flex-wrap gap-3">
            <button className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">
              Primary
            </button>

            <button className="rounded-lg bg-success px-5 py-2.5 text-sm font-semibold text-success-foreground">
              Success
            </button>

            <button className="rounded-lg bg-danger px-5 py-2.5 text-sm font-semibold text-danger-foreground">
              Danger
            </button>

            <button className="rounded-lg bg-warning px-5 py-2.5 text-sm font-semibold text-warning-foreground">
              Warning
            </button>

            <button className="rounded-lg border border-border bg-card px-5 py-2.5 text-sm font-semibold">
              Surface
            </button>

            <button className="rounded-lg bg-muted px-5 py-2.5 text-sm font-semibold text-muted-foreground">
              Muted
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  required,
}: {
  label: string;
  value?: string;
  onChange?: (value: string) => void;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium">
        {label}{" "}
        {required && <span className="text-danger">*</span>}
      </label>

      <input
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        className="w-full rounded-lg border border-input bg-card px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
      />
    </div>
  );
}