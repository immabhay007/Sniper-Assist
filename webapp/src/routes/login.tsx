import { createFileRoute } from "@tanstack/react-router";
import Login from "@/pages/auth/Login";
export const Route = createFileRoute("/login")({
  component: Login,
  ssr: false,
  validateSearch: (search) => ({
    reset: search.reset === "1" ? "1" : undefined,
  }),
});
