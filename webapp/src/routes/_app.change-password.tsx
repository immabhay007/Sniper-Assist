import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { changePasswordService } from "@/services/changePasswordService";
import { toast } from "@/utils/toast";

export const Route = createFileRoute("/_app/change-password")({
  component: ChangePasswordPage,
});

function ChangePasswordPage() {
  const navigate = useNavigate();
  const [current, setCurrent] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (newPass.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }
    if (newPass !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);
    try {
      await changePasswordService.changePassword(current, newPass);
      toast.success("Password changed successfully.");
      // Clear form
      setCurrent("");
      setNewPass("");
      setConfirm("");
      // Navigate back to settings after a short delay
      setTimeout(() => navigate({ to: "/settings" }), 1500);
    } catch (err: any) {
      const message = err.response?.data?.message || "Failed to change password. Please try again.";
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      <div className="flex items-center gap-4">
        <Link
          to="/settings"
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition hover:bg-accent hover:text-primary"
          aria-label="Back"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="space-y-1">
          <h1
            className="font-display text-2xl font-semibold tracking-tight text-foreground"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Change Password
          </h1>
          <p className="text-sm text-muted-foreground">Update your account password</p>
        </div>
      </div>

      <div className="max-w-xl">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-card md:p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <PasswordField
              label="Current password"
              value={current}
              onChange={setCurrent}
              show={showCurrent}
              toggle={() => setShowCurrent((v) => !v)}
              required
            />

            <div className="space-y-1.5">
              <PasswordField
                label="New password"
                value={newPass}
                onChange={setNewPass}
                show={showNew}
                toggle={() => setShowNew((v) => !v)}
                required
              />
              <p className="text-xs text-muted-foreground">At least 6 characters</p>
            </div>

            <PasswordField
              label="Confirm new password"
              value={confirm}
              onChange={setConfirm}
              show={showConfirm}
              toggle={() => setShowConfirm((v) => !v)}
              required
              error={confirm && confirm !== newPass ? "Passwords do not match" : undefined}
            />

            {error && <p className="text-sm text-danger">{error}</p>}

            <div className="pt-1">
              <button
                type="submit"
                disabled={isLoading || !current || newPass.length < 6 || newPass !== confirm}
                className="h-11 rounded-xl px-6 text-sm font-semibold text-white shadow-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                style={{ backgroundColor: "#544ec5" }}
              >
                {isLoading ? "Saving…" : "Save changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// --- PasswordField component (unchanged) ---
function PasswordField({
  label,
  value,
  onChange,
  show,
  toggle,
  required,
  error,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  show: boolean;
  toggle: () => void;
  required?: boolean;
  error?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-foreground">
        {label} {required && <span className="text-danger">*</span>}
      </label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-12 w-full rounded-xl border border-border bg-card px-4 pr-12 text-sm text-foreground transition placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          required={required}
        />
        <button
          type="button"
          onClick={toggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:text-foreground"
          aria-label={show ? "Hide password" : "Show password"}
        >
          {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
        </button>
      </div>
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}