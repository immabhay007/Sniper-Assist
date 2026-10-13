import { useNavigate } from "@tanstack/react-router";
import {
  HiOutlineLockClosed,
  HiOutlineLogout,
  HiOutlineMail,
  HiOutlineShieldCheck,
  HiOutlineUserCircle,
} from "react-icons/hi";
import AuthBranding from "@/components/auth/AuthBranding";
import { useAuth } from "@/context/AuthContext";
import ENV from "@/config/initializeEnvironment";

export default function AccessRequest() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate({ to: "/login" });
  };

  return (
    <div className="min-h-screen bg-background px-4 py-8 sm:py-10">
      <div
        className="absolute inset-0 -z-10 opacity-70 pointer-events-none"
        style={{
          background:
            "linear-gradient(135deg, color-mix(in oklab, var(--color-primary) 10%, transparent), transparent 34%), linear-gradient(315deg, color-mix(in oklab, var(--color-success) 9%, transparent), transparent 36%)",
        }}
      />

      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-4xl flex-col justify-center">
        <AuthBranding title={ENV.APP_NAME} subtitle="Account access status" />

        <section className="sniper-card overflow-hidden">
          <div className="grid gap-0 lg:grid-cols-[1.08fr_0.92fr]">
            <div className="p-6 sm:p-8 lg:p-10">
              <div className="mb-5 inline-flex size-12 items-center justify-center rounded-xl bg-warning-soft text-warning ring-1 ring-warning/20">
                <HiOutlineLockClosed className="size-6" aria-hidden />
              </div>

              <p className="text-sm font-semibold text-primary">Access pending</p>
              <h1 className="mt-2 text-2xl font-semibold text-foreground sm:text-3xl">
                You do not have access to any modules yet.
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
                Your sign-in was successful, but no application modules are assigned to your
                account. Please request access from the administrator or the person who manages
                team permissions.
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-border bg-surface-2/70 p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <HiOutlineUserCircle className="size-5 text-primary" aria-hidden />
                    Signed in as
                  </div>
                  <p className="mt-2 truncate text-sm text-muted-foreground">
                    {user?.full_name || "Current user"}
                  </p>
                  <p className="mt-1 truncate text-xs text-muted-foreground">{user?.email}</p>
                </div>

                <div className="rounded-lg border border-border bg-surface-2/70 p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <HiOutlineShieldCheck className="size-5 text-success" aria-hidden />
                    What to request
                  </div>
                  <p className="mt-2 text-sm leading-5 text-muted-foreground">
                    Ask for menu permissions for the modules you need to use.
                  </p>
                </div>
              </div>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <a
                  href={`mailto:?subject=${encodeURIComponent("Sniper Assist access request")}&body=${encodeURIComponent(
                    `Please assign module access for ${user?.full_name || "this user"}${user?.email ? ` (${user.email})` : ""}.`,
                  )}`}
                  className="sniper-btn sniper-btn-primary"
                >
                  <HiOutlineMail className="size-4" aria-hidden />
                  Request access
                </a>
                <button type="button" onClick={handleLogout} className="sniper-btn">
                  <HiOutlineLogout className="size-4" aria-hidden />
                  Sign out
                </button>
              </div>
            </div>

            <div className="border-t border-border bg-surface-2/70 p-6 sm:p-8 lg:border-l lg:border-t-0 lg:p-10">
              <div className="space-y-4">
                {["Dashboard", "Fund Deposits", "Expense Ledger", "Reports"].map((label) => (
                  <div key={label} className="flex items-center justify-between rounded-lg border border-border bg-surface px-4 py-3">
                    <span className="text-sm font-medium text-foreground">{label}</span>
                    <span className="sniper-chip bg-muted text-muted-foreground">No access</span>
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-lg border border-warning/25 bg-warning-soft/70 p-4 text-sm leading-6 text-foreground">
                Once permissions are assigned, sign in again or refresh this session to open your
                modules.
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
