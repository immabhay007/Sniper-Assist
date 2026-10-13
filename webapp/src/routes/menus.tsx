import { createFileRoute, redirect } from "@tanstack/react-router";
import MenusList from "@/pages/menus/MenusList";
import { can } from "@/utils/permissions";
import { requireRouteUser } from "@/utils/routeAuth";

export const Route = createFileRoute("/menus")({
  beforeLoad: async () => {
    const user = await requireRouteUser();
    if (!can(user, "menus", "can_view")) throw redirect({ to: "/dashboard" });
  },
  component: MenusList,
  ssr: false,
});
