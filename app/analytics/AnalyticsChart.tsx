// app/analytics/AnalyticsChart.tsx
"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface ChartData {
  name: string;
  Pemasukan: number;
  Pengeluaran: number;
  "Rata-rata": number;
}

export default function AnalyticsChart({ data }: { data: ChartData[] }) {
  const formatRupiah = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatYAxis = (value: number) => {
    if (value >= 1000000) return `${value / 1000000} Jt`;
    if (value >= 1000) return `${value / 1000} Rb`;
    return value.toString();
  };

  return (
    <div className="h-[350px] w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="#e5e7eb"
          />

          <XAxis
            dataKey="name"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: "#6b7280" }}
            dy={10}
          />
          <YAxis
            tickFormatter={formatYAxis}
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: "#6b7280" }}
            dx={-10}
          />

          <Tooltip
            formatter={(value: number) => [formatRupiah(value), undefined]}
            contentStyle={{
              borderRadius: "12px",
              border: "none",
              boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
            }}
          />

          <Legend wrapperStyle={{ paddingTop: "20px" }} iconType="circle" />

          {/* Garis Pemasukan */}
          <Line
            type="monotone"
            dataKey="Pemasukan"
            stroke="#10b981"
            strokeWidth={3}
            dot={{ r: 4, fill: "#fff" }}
            activeDot={{ r: 6 }}
          />

          {/* Garis Pengeluaran */}
          <Line
            type="monotone"
            dataKey="Pengeluaran"
            stroke="#f43f5e"
            strokeWidth={3}
            dot={{ r: 4, fill: "#fff" }}
            activeDot={{ r: 6 }}
          />

          {/* Garis Rata-rata */}
          <Line
            type="monotone"
            dataKey="Rata-rata"
            stroke="#3b82f6"
            strokeWidth={3}
            strokeDasharray="5 5"
            dot={{ r: 4, fill: "#fff" }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
