import { useState, FormEvent, ChangeEvent } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { authService } from "@/services/authService";
import FormInput from "@/components/common/FormInput";
import AuthBranding from "@/components/auth/AuthBranding";
import { toast } from "@/utils/toast";

interface OtpResponse {
  message: string;
  hint?: string;
  otp_sent?: boolean;
}

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const sendOtp = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      toast.error("Email is required");
      return;
    }
    setBusy(true);
    try {
      const res: OtpResponse = await authService.sendOtp(trimmedEmail);
      toast.info([res.message, res.hint].filter(Boolean).join(" "));
      setStep(2);
    } catch (error: any) {
      toast.error(error.message || "Failed to send OTP");
    } finally {
      setBusy(false);
    }
  };

  const resendOtp = async () => {
    setBusy(true);
    try {
      const res: OtpResponse = await authService.sendOtp(email.trim());
      toast.info([res.message, res.hint].filter(Boolean).join(" "));
    } catch (error: any) {
      toast.error(error.message || "Failed to resend OTP");
    } finally {
      setBusy(false);
    }
  };

  const resetPassword = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmedOtp = otp.trim();
    if (!/^\d{6}$/.test(trimmedOtp)) {
      toast.error("Enter the 6-digit code from your email");
      return;
    }
    if (newPass.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (newPass !== confirm) {
      toast.error("Passwords don't match");
      return;
    }
    setBusy(true);
    try {
      await authService.resetPassword({
        email: email.trim(),
        otp: trimmedOtp,
        newPassword: newPass,
      });
      navigate({
        to: "/login",
        search: { reset: "1" },
      });
    } catch (error: any) {
      toast.error(error.message || "Password reset failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center bg-background px-4 py-8">
      <div
        className="absolute inset-0 -z-10 opacity-60 pointer-events-none"
        style={{
          background:
            "radial-gradient(60% 50% at 20% 10%, color-mix(in oklab, var(--color-primary) 12%, transparent), transparent 60%), radial-gradient(50% 40% at 90% 90%, color-mix(in oklab, var(--color-success) 10%, transparent), transparent 60%)",
        }}
      />
      <div className="w-full max-w-md">
        <AuthBranding
          title="Reset your password"
          subtitle={
            step === 1
              ? "Enter the email address registered with your account"
              : "Enter the code from your email and choose a new password"
          }
        />

        <form
          onSubmit={step === 1 ? sendOtp : resetPassword}
          className="sniper-card p-6 space-y-4 rounded-2xl !bg-[#fffdfa] border-2 border-gray-200"
        >
          {step === 1 ? (
            // Step 1: Email input
            <div className="space-y-1">
              <label htmlFor="email" className="block text-xs font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                placeholder="Enter your email"
                autoComplete="email"
                className="w-full h-10 border-2 border-gray-300 rounded-lg px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          ) : (
            // Step 2: OTP, new password, confirm password
            <>
              <div className="rounded-lg bg-muted/40 p-2 text-sm">
                <p className="text-muted-foreground">
                  Code sent to{" "}
                  <span className="font-semibold text-foreground">{email}</span>
                </p>
              </div>

              {/* Verification code */}
              <div className="space-y-1">
                <label htmlFor="otp" className="block text-xs font-medium text-gray-700">
                  Verification code
                </label>
                <input
                  id="otp"
                  type="text"
                  required
                  value={otp}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  placeholder="6-digit code"
                  maxLength={6}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  className="w-full h-10 border-2 border-gray-300 rounded-lg px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* New password */}
              <div className="space-y-1">
                <label htmlFor="newPass" className="block text-xs font-medium text-gray-700">
                  New password
                </label>
                <div className="relative">
                  <input
                    id="newPass"
                    type={showNewPass ? "text" : "password"}
                    required
                    value={newPass}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setNewPass(e.target.value)}
                    autoComplete="new-password"
                    placeholder="New password"
                    className="w-full h-10 border-2 border-gray-300 rounded-lg px-3 pr-10 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
                    tabIndex={-1}
                    aria-label={showNewPass ? "Hide password" : "Show password"}
                  >
                    {showNewPass ? (
                      // Eye open icon (SVG)
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    ) : (
                      // Eye closed icon (SVG)
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-500">At least 6 characters</p>
              </div>

              {/* Confirm password */}
              <div className="space-y-1">
                <label htmlFor="confirm" className="block text-xs font-medium text-gray-700">
                  Confirm password
                </label>
                <div className="relative">
                  <input
                    id="confirm"
                    type={showConfirm ? "text" : "password"}
                    required
                    value={confirm}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setConfirm(e.target.value)}
                    autoComplete="new-password"
                    placeholder="Confirm password"
                    className="w-full h-10 border-2 border-gray-300 rounded-lg px-3 pr-10 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
                    tabIndex={-1}
                    aria-label={showConfirm ? "Hide password" : "Show password"}
                  >
                    {showConfirm ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <button
                type="button"
                disabled={busy}
                onClick={resendOtp}
                className="
                  w-full
                  py-2
                  rounded-xl
                  border
                  border-blue-200
                  bg-blue-50
                  text-blue-600
                  text-sm
                  font-medium
                  transition-all
                  hover:bg-blue-100
                  disabled:opacity-50
                "
              >
                Resend Code
              </button>
            </>
          )}

          <div className="flex justify-center">
            <button
              type="submit"
              disabled={busy}
              className="
                px-8
                w-full
                py-2
                rounded-xl
                bg-[#5c20c0]
                text-white
                text-sm
                font-semibold
                shadow-md
                transition-all
                hover:bg-[#4b1aa0]
                active:scale-[0.98]
                disabled:opacity-60
                disabled:cursor-not-allowed
              "
            >
              {busy ? "Please wait..." : step === 1 ? "Send Code" : "Reset Password"}
            </button>
          </div>

          <div className="pt-1 text-center">
            <Link
              to="/login"
              search={{}}
              className="
                inline-flex
                items-center
                text-xs
                font-medium
                text-blue-600
                hover:text-blue-700
                hover:underline
              "
            >
              ← Back to Sign In
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}