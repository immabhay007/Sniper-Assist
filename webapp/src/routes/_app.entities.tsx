import { createFileRoute } from "@tanstack/react-router";
import EntityListPage from "@/pages/entities/EntityListPage";

export const Route = createFileRoute("/_app/entities")({
  component: EntityListPage,
});
