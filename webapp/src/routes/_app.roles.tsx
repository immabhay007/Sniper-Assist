import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui-kit/Card";
import { Chip } from "@/components/ui-kit/Chip";
import { roles } from "@/lib/data";
import { Check, Plus } from "lucide-react";

export const Route = createFileRoute("/_app/roles")({
  component: RolesPage,
});

function RolesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{roles.length} roles · 21 active assignments</p>
        <button className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">
          <Plus className="h-4 w-4" /> New role
        </button>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {roles.map((r) => (
          <Card key={r.name}>
            <div className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-display text-lg font-semibold" style={{ fontFamily: "var(--font-display)" }}>{r.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{r.desc}</p>
                </div>
                <Chip tone="primary">{r.members} members</Chip>
              </div>
              <div className="mt-4 space-y-2">
                {r.perms.map((p) => (
                  <div key={p} className="flex items-center gap-2 text-sm">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-success-soft text-success">
                      <Check className="h-3 w-3" />
                    </span>
                    {p}
                  </div>
                ))}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
