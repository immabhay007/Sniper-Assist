import { createFileRoute } from "@tanstack/react-router";
import UsersList from "@/pages/users/UsersList";

export const Route = createFileRoute("/users/")({
  component: UsersList,
  ssr: false,
});
