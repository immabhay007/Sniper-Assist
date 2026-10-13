import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { can } from "@/utils/permissions";
import { requireRouteUser } from "@/utils/routeAuth";

export const Route = createFileRoute("/users")({
  beforeLoad: async () => {
    const user = await requireRouteUser();
    if (!can(user, "users", "can_view")) throw redirect({ to: "/dashboard" });
  },
  component: () => <Outlet />,
  ssr: false,
});
