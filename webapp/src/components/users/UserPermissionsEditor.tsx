const PERM_KEYS = [
  { key: "can_view", label: "View" },
  { key: "can_create", label: "Create" },
  { key: "can_edit", label: "Edit" },
  { key: "can_delete", label: "Delete" },
  { key: "can_export", label: "Export" },
  { key: "can_upload", label: "Upload" },
];

const ALL_PERM_KEYS = PERM_KEYS.map(({ key }) => key);

function applyAllPermissions(permissions, value) {
  return permissions.map((p) =>
    ALL_PERM_KEYS.reduce((row, key) => ({ ...row, [key]: value }), { ...p }),
  );
}

export default function UserPermissionsEditor({ permissions, onChange, disabled }) {
  const toggle = (menuId, permKey) => {
    onChange(
      permissions.map((p) =>
        p.menu_id === menuId ? { ...p, [permKey]: !p[permKey] } : p,
      ),
    );
  };

  const toggleAccess = (menuId) => {
    onChange(
      permissions.map((p) => {
        if (p.menu_id !== menuId) return p;
        const access = !p.can_view;
        return {
          ...p,
          can_view: access,
          can_create: access ? p.can_create : false,
          can_edit: access ? p.can_edit : false,
          can_delete: access ? p.can_delete : false,
          can_export: access ? p.can_export : false,
          can_upload: access ? p.can_upload : false,
        };
      }),
    );
  };

  const grantAllAccess = () => {
    onChange(permissions.map((p) => ({ ...p, can_view: true })));
  };

  const grantFullPermissions = () => {
    onChange(applyAllPermissions(permissions, true));
  };

  const clearAllPermissions = () => {
    onChange(applyAllPermissions(permissions, false));
  };

  const setBulkPermission = (permKey, value) => {
    onChange(
      permissions.map((p) => ({
        ...p,
        [permKey]: value,
        ...(permKey !== "can_view" && value ? { can_view: true } : {}),
        ...(permKey === "can_view" && !value
          ? {
              can_create: false,
              can_edit: false,
              can_delete: false,
              can_export: false,
              can_upload: false,
            }
          : {}),
      })),
    );
  };

  return (
    <div className="overflow-x-auto sniper-card p-0">
      <div className="flex flex-col gap-3 border-b border-border bg-muted/20 px-4 py-3 sm:flex-row sm:flex-wrap sm:items-center">
        <span className="text-xs font-medium text-muted-foreground shrink-0">Quick actions</span>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={disabled}
            onClick={grantAllAccess}
            className="sniper-btn !text-xs !py-1 !px-2.5"
          >
            Enable all access
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={grantFullPermissions}
            className="sniper-btn sniper-btn-primary !text-xs !py-1 !px-2.5"
          >
            Grant full permissions
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={clearAllPermissions}
            className="sniper-btn !text-xs !py-1 !px-2.5 !text-danger hover:!bg-danger-soft"
          >
            Clear all
          </button>
        </div>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground bg-muted/40">
            <th className="px-4 py-2.5 font-medium">Menu</th>
            <th className="px-4 py-2.5 font-medium">
              <div className="flex flex-col gap-1">
                <span>Access</span>
                <div className="flex gap-1 normal-case tracking-normal font-normal">
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={grantAllAccess}
                    className="text-[10px] text-primary hover:underline disabled:opacity-40"
                  >
                    All on
                  </button>
                  <span className="text-muted-foreground/50">·</span>
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => setBulkPermission("can_view", false)}
                    className="text-[10px] text-muted-foreground hover:underline disabled:opacity-40"
                  >
                    All off
                  </button>
                </div>
              </div>
            </th>
            <th className="px-4 py-2.5 font-medium">
              <div className="flex flex-col gap-1.5">
                <span>Permissions</span>
                <div className="flex flex-wrap gap-1 normal-case tracking-normal font-normal">
                  {PERM_KEYS.filter((k) => k.key !== "can_view").map(({ key, label }) => (
                    <button
                      type="button"
                      key={key}
                      disabled={disabled}
                      onClick={() => setBulkPermission(key, true)}
                      className="sniper-chip border border-primary/20 bg-primary-soft/50 text-[10px] text-primary hover:bg-primary-soft disabled:opacity-40"
                    >
                      All {label}
                    </button>
                  ))}
                </div>
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          {permissions.map((p) => (
            <tr key={p.menu_id} className="border-t border-border">
              <td className="px-4 py-3 font-medium">
                {p.menu_name}
                <span className="block text-[10px] text-muted-foreground font-normal">{p.menu_key}</span>
              </td>
              <td className="px-4 py-3">
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => toggleAccess(p.menu_id)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition disabled:opacity-40 ${
                    p.can_view ? "bg-primary" : "bg-muted-foreground/30"
                  }`}
                >
                  <span
                    className={`inline-block size-4 rounded-full bg-white transition-transform ${
                      p.can_view ? "translate-x-[18px]" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-1.5">
                  {PERM_KEYS.filter((k) => k.key !== "can_view").map(({ key, label }) => (
                    <button
                      type="button"
                      key={key}
                      disabled={disabled || !p.can_view}
                      onClick={() => toggle(p.menu_id, key)}
                      className={`sniper-chip border text-[10px] ${
                        p[key]
                          ? "bg-primary-soft text-primary border-primary/30"
                          : "bg-transparent text-muted-foreground border-border"
                      } disabled:opacity-40`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
