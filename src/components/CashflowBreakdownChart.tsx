"use client";

import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

import { Card } from "@/components/EntityListShell";

const COLORS = [
  "#3b82f6",
  "#10b981",
  "#f97316",
  "#ec4899",
  "#8b5cf6",
  "#06b6d4",
  "#84cc16",
  "#f59e0b",
  "#a855f7",
  "#64748b",
  "#14b8a6",
  "#ef4444",
];

const CURRENCY = new Intl.NumberFormat("en", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

type Slice = { name: string; value: number };

export function CashflowBreakdownChart({
  title,
  data,
}: {
  title: string;
  data: Slice[];
}) {
  const filtered = data.filter((d) => d.value > 0);
  return (
    <Card>
      <span className="text-xs uppercase tracking-wide text-zinc-500">
        {title}
      </span>
      {filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-zinc-500">No data.</p>
      ) : (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={filtered}
                dataKey="value"
                nameKey="name"
                outerRadius={75}
              >
                {filtered.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) =>
                  typeof value === "number" ? CURRENCY.format(value) : ""
                }
                contentStyle={{ fontSize: 12 }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}
