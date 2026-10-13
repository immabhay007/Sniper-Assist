import { createFileRoute } from "@tanstack/react-router";
import UserPermissionsPage from "@/pages/users/UserPermissionsPage";

export const Route = createFileRoute("/users/$userId/permissions")({
  component: UserPermissionsRoute,
  ssr: false,
});

function UserPermissionsRoute() {
  const { userId } = Route.useParams();
  return <UserPermissionsPage userId={userId} />;
}
