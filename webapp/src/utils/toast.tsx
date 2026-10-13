import { toast as sonner } from "sonner";
import type { ExternalToast } from "sonner";

const DEFAULT_DURATION = 4500;

function show(
  type: "success" | "error" | "warning" | "info",
  message: string,
  options?: ExternalToast
) {
  const fn = sonner[type];

  if (typeof fn !== "function") {
    return sonner(message, options);
  }

  return fn(message, {
    duration: DEFAULT_DURATION,
    ...options,
  });
}

/** Reusable app toasts — success, warning, error, info */
export const toast = {
  success: (message: string, options?: ExternalToast) =>
    show("success", message, options),

  error: (message: string, options?: ExternalToast) =>
    show("error", message, options),

  warning: (message: string, options?: ExternalToast) =>
    show("warning", message, options),

  info: (message: string, options?: ExternalToast) =>
    show("info", message, options),

  dismiss: sonner.dismiss,

  promise: sonner.promise,
};

export default toast;