import { createFileRoute, redirect } from "@tanstack/react-router";
import { loadRouteUser } from "@/utils/routeAuth";

export const Route = createFileRoute("/")({
  beforeLoad: async () => {
    const user = await loadRouteUser();
    throw redirect({ to: user ? "/dashboard" : "/login" });
  },
  component: () => null,
});
