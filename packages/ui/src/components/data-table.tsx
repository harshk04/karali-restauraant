"use client";

import { Card } from "./card";

export function DataTable<T extends Record<string, unknown>>({
  columns,
  rows,
}: {
  columns: Array<{ key: keyof T; label: string }>;
  rows: T[];
}) {
  return (
    <Card className="overflow-hidden p-0">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-[#fff1e9]/90 text-xs uppercase tracking-[0.24em] text-[#554336]/60">
            <tr>
              {columns.map((column) => (
                <th
                  key={String(column.key)}
                  className="px-5 py-4 font-semibold"
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr
                key={index}
                className="border-t border-black/5 transition-colors hover:bg-white/55"
              >
                {columns.map((column) => (
                  <td
                    key={String(column.key)}
                    className="px-5 py-4 align-top text-[#231a13]"
                  >
                    {row[column.key] as any}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
