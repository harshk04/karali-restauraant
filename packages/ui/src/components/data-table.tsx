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
      <div className="md:hidden">
        <div className="space-y-3 p-3 sm:p-4">
          {rows.map((row, index) => (
            <Card key={index} className="space-y-3 p-4">
              {columns.map((column) => (
                <div
                  key={String(column.key)}
                  className="flex items-start justify-between gap-4"
                >
                  <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#554336]/60">
                    {column.label}
                  </span>
                <span className="max-w-[60%] break-words text-right text-sm text-[#231a13]">
                    {row[column.key] as any}
                </span>
              </div>
            ))}
            </Card>
          ))}
          {!rows.length ? (
            <div className="px-2 py-6 text-center text-sm text-[#554336]">
              No records found.
            </div>
          ) : null}
        </div>
      </div>
      <div className="hidden overflow-x-auto md:block">
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
