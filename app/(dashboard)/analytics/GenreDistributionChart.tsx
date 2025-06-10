// filepath: c:\JavaScript\library-app\components\analytics\GenreDistributionChart.tsx
"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface GenreChartData {
  name: string;
  value: number;
}

interface GenreDistributionChartProps {
  data: GenreChartData[];
}

export default function GenreDistributionChart({ data }: GenreDistributionChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        No genre data available. Add books with genres to see distribution.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={data}
        layout="vertical" // For horizontal bars, easier to read genre names
        margin={{
          top: 5,
          right: 30,
          left: 50, // Increased left margin for longer genre names
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" />
        <YAxis dataKey="name" type="category" width={100} interval={0} /> 
        <Tooltip 
            contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
            labelStyle={{ color: 'hsl(var(--foreground))' }}
        />
        <Legend />
        <Bar dataKey="value" name="Books" fill="hsl(var(--primary))" barSize={20} />
      </BarChart>
    </ResponsiveContainer>
  );
}