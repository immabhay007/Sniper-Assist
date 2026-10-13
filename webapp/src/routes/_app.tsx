import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppLayout } from "@/components/layout/AppLayout";
import { requireRouteUser } from "@/utils/routeAuth";

export const Route = createFileRoute("/_app")({
  ssr: false,
  beforeLoad: async () => {
    await requireRouteUser();
  },
  component: () => <AppLayout />,
});

export { Outlet };
