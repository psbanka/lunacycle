import { Activity } from "lucide-react";
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Legend } from "recharts";
import { useTask } from "@/contexts/TaskContext";
import { LoadingScreen } from "@/components/LoadingScreen";

export default function Goals() {
  const { loadingTasks, statistics } = useTask();
  if (loadingTasks) {
    return <LoadingScreen />;
  }

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
          <BarChart width={900} height={300} data={statistics}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <Bar dataKey="completed" fill="hsl(var(--primary))" />
            <Bar dataKey="committed" fill="hsl(var(--secondary))" />
            <XAxis
              dataKey="name"
              stroke="hsl(var(--muted-foreground))"
              axisLine={{ stroke: "hsl(var(--border))" }}
              tickLine={false}
            />
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              axisLine={{ stroke: "hsl(var(--border))" }}
              tickLine={false}
            />
            <Legend wrapperStyle={{ color: "hsl(var(--muted-foreground))", paddingTop: '20px' }} />
          </BarChart>
        </div>
      </div>
    </div>
  );
}
