import { Activity } from "lucide-react";
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Legend } from "recharts";
import { MOON_NAMES } from "../../shared/lunarPhase";

function generateNumberBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const data = Array(10)
  .fill(0)
  .map((_, i) => {
    const completed = generateNumberBetween(10, 70);
    const committed = generateNumberBetween(completed, 100);
    const monthName = MOON_NAMES[i];
    const name = monthName.split(" ")[0];
    return { name, completed, committed };
  });

function pickOne<T>(arr: readonly T[]): T {
  if (arr.length === 0) throw new Error("have to provide a non-empty array");
  const output = arr[Math.floor(Math.random() * arr.length)];
  return output!;
}

export default function Goals() {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-row justify-between mb-8 gap-4">
        <div>
          <h1 className="text-left text-3xl font-bold">Goals</h1>
          <p className="text-muted-foreground">
            Set and track your long-term goals.
          </p>
        </div>
        <div className="flex items-center">
          <Activity className="h-8 w-8" />
        </div>
      </div>
      <div className="text-center py-10 glass-card rounded-lg">
        <div className="flex-row items-center justify-stretch">
          <div>
            <h2 className="text-2xl font-semibold">Velocity</h2>
            <p className="text-muted-foreground mt-2">
              Track your history of task completion versus commitment
            </p>
          </div>
          <LineChart width={900} height={300} data={data}>
            <CartesianGrid />
            <Line dataKey="completed" />
            <Line dataKey="committed" />
            <XAxis dataKey="name" />
            <YAxis />
            <Legend />
          </LineChart>
        </div>
      </div>
    </div>
  );
}
