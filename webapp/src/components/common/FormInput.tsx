import { useState } from "react";
import { HiOutlineEye, HiOutlineEyeOff } from "react-icons/hi";

export default function FormInput({ label, required, error, hint, className = "", type, ...props }) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword ? (showPassword ? "text" : "password") : type;

  return (
    <label className={`block ${className}`}>
      {label && (
        <span className="block text-[13px] font-medium mb-1.5">
          {label} {required && <span className="text-danger">*</span>}
        </span>
      )}
      <div className={isPassword ? "relative" : undefined}>
        <input
          className={`sniper-input w-full ${error ? "!border-danger" : ""} ${isPassword ? "!pr-9" : ""}`}
          type={inputType}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            tabIndex={-1}
            aria-label={showPassword ? "Hide password" : "Show password"}
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
          >
            {showPassword ? (
              <HiOutlineEyeOff className="size-4" aria-hidden />
            ) : (
              <HiOutlineEye className="size-4" aria-hidden />
            )}
          </button>
        )}
      </div>
      {error ? (
        <span className="block mt-1 text-xs text-danger">{error}</span>
      ) : hint ? (
        <span className="block mt-1 text-xs text-muted-foreground">{hint}</span>
      ) : null}
    </label>
  );
}
