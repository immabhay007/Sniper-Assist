import { tableCellWrapClass } from "@/utils/datetime";

export default function DataTable({ columns, data, emptyText = "No records", minWidth = 960 }) {
  return (
    <div className="overflow-x-auto sniper-card">
      <table
        className="w-full text-sm border-collapse table-auto"
        style={{ minWidth: typeof minWidth === "number" ? `${minWidth}px` : minWidth }}
      >
        <colgroup>
          {columns.map((c) => (
            <col
              key={c.key}
              style={c.width ? { width: c.width } : undefined}
              className={c.colClassName}
            />
          ))}
        </colgroup>
        <thead>
          <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground bg-muted/50">
            {columns.map((c) => (
              <th
                key={c.key}
                className={`px-4 py-3 font-medium align-top ${c.headerClassName || ""}`}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center text-muted-foreground">
                {emptyText}
              </td>
            </tr>
          ) : (
            data.map((row, i) => (
              <tr key={row.id ?? i} className="border-t border-border hover:bg-muted/30 transition-colors">
                {columns.map((c) => (
                  <td
                    key={c.key}
                    className={`px-4 py-3 ${
                      c.wrap === false ? "align-top whitespace-nowrap" : tableCellWrapClass
                    } ${c.className || ""}`}
                  >
                    {c.render ? c.render(row) : row[c.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
