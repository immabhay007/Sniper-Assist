import { createFileRoute, redirect } from "@tanstack/react-router";
import AccessRequest from "@/pages/auth/AccessRequest";
import { firstAccessibleRoute, hasAnyModuleAccess } from "@/utils/permissions";
import { requireRouteUser } from "@/utils/routeAuth";

export const Route = createFileRoute("/access-request")({
  beforeLoad: async () => {
    const user = await requireRouteUser();
    if (hasAnyModuleAccess(user)) {
      throw redirect({ to: firstAccessibleRoute(user) });
    }
  },
  component: AccessRequest,
  ssr: false,
});
