import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, Link, useSearch } from "@tanstack/react-router";
import { HiOutlineEye, HiOutlineEyeOff, HiOutlineMail, HiOutlineLockClosed } from "react-icons/hi";
import { useAuth } from "@/context/AuthContext";
import AuthBranding from "@/components/auth/AuthBranding";
import { toast } from "@/utils/toast";
import { storage } from "@/utils/storage";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { reset } = useSearch({ from: "/login" });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (reset === "1") {
      toast.success("Password reset successfully. Sign in with your new password.");
    }
  }, [reset]);

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email || !/.+@.+\..+/.test(email)) return toast.error("Enter a valid email");
    if (!password || password.length < 6) return toast.error("Password must be at least 6 characters");
    setBusy(true);
    try {
      // /auth/login payload is { email, password }; remember only affects client-side token persistence.
      const loggedIn = await login({ email, password, remember });
      storage.set("sniper-care-user", loggedIn);
      navigate({
        to: "/dashboard",
      });
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Login failed"
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center bg-background px-4 py-10">
      <div
        className="absolute inset-0 -z-10 opacity-60 pointer-events-none"
        style={{
          background:
            "radial-gradient(70% 55% at 50% 0%, color-mix(in oklab, var(--color-primary) 12%, transparent), transparent 60%), radial-gradient(40% 30% at 92% 92%, color-mix(in oklab, var(--color-primary) 8%, transparent), transparent 60%)",
        }}
      />
      <div className="w-full max-w-[390px]">
        <AuthBranding
          title="Sniper Assist"
          subtitle="Sign in for customer care"
        />

        <form
          onSubmit={submit}
          className="sniper-card rounded-2xl p-5 sm:p-6 space-y-3.5 border border-border/80 shadow-[0_8px_30px_rgba(28,28,45,0.08)]"
          style={{ backgroundColor: "#fffdfa" }}
        >
          <label className="block">
            <span className="block text-[12px] font-medium mb-1.5">Email</span>
            <div className="relative">
              <HiOutlineMail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full h-10 rounded-md border border-[#98a1a9] bg-white pl-9 pr-3 text-sm placeholder:text-[#98a1a9] focus:outline-none focus:ring-0 focus:border-[#98a1a9]"
                autoComplete="email"
              />
            </div>
          </label>

          <label className="block">
            <span className="block text-[12px] font-medium mb-1.5">Password</span>
            <div className="relative">
              <HiOutlineLockClosed className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input
                type={show ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-10 rounded-md border border-[#98a1a9] bg-white pl-9 pr-9 text-sm placeholder:text-[#98a1a9] focus:outline-none focus:ring-0 focus:border-[#98a1a9]"
                autoComplete="current-password"
              />
              <button
                type="button"
                tabIndex={-1}
                aria-label={show ? "Hide password" : "Show password"}
                onClick={() => setShow((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
              >
                {show ? (
                  <HiOutlineEyeOff className="size-4" aria-hidden />
                ) : (
                  <HiOutlineEye className="size-4" aria-hidden />
                )}
              </button>
            </div>
          </label>

          <div className="flex items-center justify-between text-[13px]">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="rounded border-border text-primary focus:ring-primary"
              />
              <span className="text-muted-foreground">Remember me</span>
            </label>
            <Link to="/forgot-password" className="text-primary hover:underline font-medium">
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={busy}
            className="sniper-btn w-full h-10 text-[14px] font-semibold text-white disabled:opacity-60"
            style={{ backgroundColor: "#5b2bc5" }}
          >
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
