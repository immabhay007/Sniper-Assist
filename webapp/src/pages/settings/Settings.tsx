import { useEffect, useState } from "react";
import DashboardLayout from "@/layout/DashboardLayout";
import FormInput from "@/components/common/FormInput";
import { useAuth } from "@/context/AuthContext";
import ENV from "@/config/initializeEnvironment";
import { authService } from "@/services/authService";
import { toast } from "@/utils/toast";

export default function Settings() {
  const { user, setUser } = useAuth();
  const [profile, setProfile] = useState({ full_name: "", email: "", phone: "" });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    setProfile({
      full_name: user.full_name || "",
      email: user.email || "",
      phone: user.phone || "",
    });
  }, [user]);

  const saveProfile = async (e) => {
    e.preventDefault();
    if (!profile.full_name?.trim()) {
      toast.warning("Full name is required.");
      return;
    }
    if (!profile.email?.trim()) {
      toast.warning("Email is required.");
      return;
    }
    setBusy(true);
    try {
      const updated = await authService.updateProfile(profile);
      setUser(updated);
      toast.success("Profile saved.");
    } catch (error) {
      toast.error(error.message || "Could not save profile.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <DashboardLayout title="Settings" subtitle="Workspace and profile preferences">
      <div className="grid lg:grid-cols-2 gap-5">
        <form onSubmit={saveProfile} className="sniper-card p-6">
          <h3 className="text-[15px] font-semibold mb-4">Profile</h3>
          <div className="grid grid-cols-1 gap-3">
            <FormInput
              label="Full name"
              required
              value={profile.full_name}
              onChange={(e) => setProfile((p) => ({ ...p, full_name: e.target.value }))}
              disabled={busy}
            />
            <FormInput
              label="Email"
              type="email"
              required
              value={profile.email}
              onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}
              disabled={busy}
            />
            <FormInput
              label="Phone"
              value={profile.phone}
              onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
              disabled={busy}
            />
            <div className="pt-1">
              <button
                type="submit"
                disabled={busy}
                className="sniper-btn sniper-btn-primary disabled:opacity-60"
              >
                {busy ? "Saving…" : "Save profile"}
              </button>
            </div>
          </div>
        </form>

        <div className="sniper-card p-6">
          <h3 className="text-[15px] font-semibold mb-4">Application</h3>
          <dl className="text-sm divide-y divide-border">
            <div className="py-2.5 flex justify-between">
              <dt className="text-muted-foreground">App name</dt>
              <dd>{ENV.APP_NAME}</dd>
            </div>
            <div className="py-2.5 flex justify-between">
              <dt className="text-muted-foreground">Environment</dt>
              <dd className="capitalize">{ENV.APP_ENV}</dd>
            </div>
            <div className="py-2.5 flex justify-between">
              <dt className="text-muted-foreground">Version</dt>
              <dd>{ENV.APP_VERSION}</dd>
            </div>
            <div className="py-2.5 flex justify-between">
              <dt className="text-muted-foreground">Currency</dt>
              <dd>{ENV.DEFAULT_CURRENCY}</dd>
            </div>
            <div className="py-2.5 flex justify-between">
              <dt className="text-muted-foreground">Date format</dt>
              <dd>{ENV.DATE_FORMAT}</dd>
            </div>
          </dl>
        </div>

        <div className="sniper-card p-6 lg:col-span-2">
          <h3 className="text-[15px] font-semibold mb-4">Theme preview</h3>
          <div className="flex flex-wrap gap-3">
            {[
              ["Primary", "bg-primary text-primary-foreground"],
              ["Success", "bg-success text-success-foreground"],
              ["Danger", "bg-danger text-danger-foreground"],
              ["Warning", "bg-warning text-warning-foreground"],
              ["Surface", "bg-surface text-foreground border border-border"],
              ["Muted", "bg-muted text-foreground"],
            ].map(([n, cls]) => (
              <div key={n} className={`px-4 py-3 rounded-lg text-sm font-medium ${cls}`}>
                {n}
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
