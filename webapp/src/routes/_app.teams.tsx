import { createFileRoute, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, useRef, useMemo } from "react";
import { Card } from "@/components/ui-kit/Card";
import { Chip } from "@/components/ui-kit/Chip";
import { teamService, type TeamUser } from "@/services/teamService";
import { ArrowLeft, Lock, Pencil, Trash2, X } from "lucide-react";
import api from "@/config/axios";
import { toast } from "@/utils/toast";
import { isAxiosError } from "axios";
import { usePageSearch } from "@/context/PageSearchContext";

export const Route = createFileRoute("/_app/teams")({
  component: TeamsPage,
});

// Unified error handler – extracts detail and shows ONE toast
const handleApiError = (error: unknown, defaultMessage: string) => {
  let message = defaultMessage;
  if (isAxiosError(error)) {
    const detail = (error.response?.data as { detail?: string })?.detail;
    if (detail) {
      message = detail;
    } else if (error.response?.status === 403) {
      message = "You don't have permission to perform this action.";
    }
  }
  toast.error(message);
  return message;
};

function TeamsPage() {
  const [team, setTeam] = useState<TeamUser[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"team" | "add">("team");
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteSaving, setDeleteSaving] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [deleteTargetName, setDeleteTargetName] = useState("");
  const routerState = useRouterState();
  const isChildRoute = routerState.location.pathname.startsWith("/teams/permissions/");

  // Global search context
  const { query, setResultCount } = usePageSearch();
  const searchTerm = query.trim().toLowerCase();

  // Ref to prevent duplicate API calls (strict mode double mount)
  const isFetching = useRef(false);

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    if (isFetching.current) return;
    isFetching.current = true;
    try {
      setLoading(true);
      const response = await teamService.getTeams();
      console.log("TEAM API RESPONSE", response);
      setTeam(response || []);
    } catch (error) {
      console.error("Failed to fetch teams", error);
      handleApiError(error, "Failed to load team members.");
    } finally {
      setLoading(false);
      isFetching.current = false;
    }
  };

  // Filter team members based on global search query
  const filteredTeam = useMemo(() => {
    if (!searchTerm) return team;
    return team.filter((m) =>
      m.full_name.toLowerCase().includes(searchTerm) ||
      m.email.toLowerCase().includes(searchTerm) ||
      m.role.toLowerCase().includes(searchTerm) ||
      (m.phone && m.phone.includes(searchTerm))
    );
  }, [team, searchTerm]);

  // Update match count in header
  useEffect(() => {
    setResultCount(filteredTeam.length);
  }, [filteredTeam, setResultCount]);

  const handleDelete = async () => {
    if (!deleteTargetId) return;
    try {
      setDeleteSaving(true);
      await api.delete(`/users/${deleteTargetId}`);
      toast.success("User deleted successfully.");
      setTeam((prev) => prev.filter((u) => u.id !== deleteTargetId));
      setIsDeleteOpen(false);
      setDeleteTargetId(null);
      setDeleteTargetName("");
    } catch (error) {
      console.error(error);
      handleApiError(error, "Failed to delete user.");
    } finally {
      setDeleteSaving(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const tones = [
    "primary",
    "success",
    "info",
    "warning",
    "danger",
  ] as const;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-xl bg-muted p-1">
          <button
            onClick={() => setActiveTab("team")}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === "team"
                ? "bg-card shadow-card text-foreground"
                : "text-muted-foreground hover:bg-card hover:shadow-card"
            }`}
          >
            Team members
          </button>

          <button
            onMouseEnter={() => setActiveTab("add")}
            onMouseLeave={() => setActiveTab("team")}
            onClick={() => navigate({ to: "/users/create" })}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === "add"
                ? "bg-card shadow-card text-foreground"
                : "text-muted-foreground hover:bg-card hover:shadow-card"
            }`}
          >
            Add member
          </button>
        </div>
        <div className="text-sm text-muted-foreground">
          {filteredTeam.length} member{filteredTeam.length !== 1 && "s"}
        </div>
      </div>

      <Card>
        {!isChildRoute ? (
          <>
            <div className="px-6 pt-5 pb-2 text-sm font-semibold">
              {searchTerm ? "Filtered results" : "Active"} ({filteredTeam.length})
            </div>

            {loading ? (
              <div className="p-10 text-center text-sm text-muted-foreground">
                Loading team members...
              </div>
            ) : filteredTeam.length === 0 ? (
              <div className="px-5 pb-6 text-sm text-muted-foreground">
                {searchTerm ? "No members match your search." : "No team members found."}
              </div>
            ) : (
              <div className="grid gap-4 p-5 lg:grid-cols-2">
                {filteredTeam.map((m, index) => {
                  const tone = tones[index % tones.length];

                  const avatarBg = {
                    primary: "bg-primary-soft text-primary",
                    success: "bg-success-soft text-success",
                    info: "bg-info-soft text-info",
                    warning: "bg-warning-soft text-warning",
                    danger: "bg-danger-soft text-danger",
                  }[tone];

                  return (
                    <div
                      key={m.id}
                      className="rounded-xl border border-border bg-card p-4"
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`flex h-11 w-11 items-center justify-center rounded-full font-semibold ${avatarBg}`}
                        >
                          {getInitials(m.full_name)}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold">
                              {m.full_name}
                            </p>

                            <Chip
                              tone={
                                m.role === "admin"
                                  ? "primary"
                                  : m.role === "supervisor"
                                  ? "warning"
                                  : "info"
                              }
                            >
                              {m.role}
                            </Chip>
                          </div>

                          <p className="mt-0.5 text-sm text-muted-foreground">
                            {m.email}
                          </p>

                          <p className="text-xs text-muted-foreground">
                            {m.phone}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <Chip tone="success">
                            {m.is_active ? "Active" : "Inactive"}
                          </Chip>

                          <button
                            onClick={() =>
                              navigate({
                                to: "/user/$userId/edit",
                                params: { userId: String(m.id) },
                              })
                            }
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-primary"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>

                          <button
                            onClick={() => {
                              setDeleteTargetId(m.id);
                              setDeleteTargetName(m.full_name);
                              setIsDeleteOpen(true);
                            }}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-danger hover:bg-danger-soft"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                      <button
                        onClick={() =>
                          navigate({
                            to: "/teams/permissions/$id",
                            params: { id: String(m.id) },
                          })
                        }
                        className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border py-2 text-xs font-medium text-muted-foreground hover:bg-accent"
                      >
                        <Lock className="h-3.5 w-3.5" />
                        Manage permissions
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          <Outlet />
        )}
      </Card>

      {isDeleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md">
            <Card>
              <div className="flex items-start justify-between border-b border-border px-5 py-4">
                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      if (deleteSaving) return;
                      setIsDeleteOpen(false);
                      setDeleteTargetId(null);
                      setDeleteTargetName("");
                    }}
                    className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition hover:bg-accent"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>

                  <div>
                    <h2 className="text-lg font-semibold text-foreground">
                      Delete User
                    </h2>

                    <p className="text-sm text-muted-foreground">
                      Are you sure you want to delete{" "}
                      <span className="font-medium">
                        {deleteTargetName}
                      </span>
                      ?
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (deleteSaving) return;
                    setIsDeleteOpen(false);
                    setDeleteTargetId(null);
                    setDeleteTargetName("");
                  }}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-4">
                <button
                  type="button"
                  onClick={() => {
                    if (deleteSaving) return;
                    setIsDeleteOpen(false);
                    setDeleteTargetId(null);
                    setDeleteTargetName("");
                  }}
                  className="h-10 rounded-lg border border-border bg-card px-4 text-sm font-medium"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={() => {
                    void handleDelete();
                  }}
                  disabled={deleteSaving}
                  className="h-10 rounded-lg bg-danger px-5 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {deleteSaving ? "Deleting..." : "Delete"}
                </button>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}