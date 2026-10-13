import { createFileRoute } from "@tanstack/react-router";
import ForgotPassword from "@/pages/auth/ForgotPassword";
export const Route = createFileRoute("/forgot-password")({ component: ForgotPassword, ssr: false });
