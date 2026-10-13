import { useState } from "react";
import DashboardLayout from "@/layout/DashboardLayout";
import FormInput from "@/components/common/FormInput";
import { authService } from "@/services/authService";
import { toast } from "@/utils/toast";

export default function ChangePassword() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (next !== confirm) return toast.error("Passwords don't match");
    setBusy(true);
    try {
      await authService.changePassword({ current, next });
      toast.success("Password updated successfully");
      setCurrent("");
      setNext("");
      setConfirm("");
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <DashboardLayout title="Change Password" subtitle="Update your account password">
      <form onSubmit={submit} className="sniper-card p-6 max-w-xl space-y-4">
        <FormInput label="Current password" type="password" required value={current} onChange={(e) => setCurrent(e.target.value)} />
        <FormInput label="New password" type="password" required value={next} onChange={(e) => setNext(e.target.value)} hint="At least 6 characters" />
        <FormInput label="Confirm new password" type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        <button disabled={busy} className="sniper-btn sniper-btn-primary">{busy ? "Saving…" : "Save changes"}</button>
      </form>
    </DashboardLayout>
  );
}
