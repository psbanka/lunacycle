import { Activity } from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Legend,
  Tooltip,
} from "recharts";
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
          <BarChart width={900} height={300} data={statistics?.overall}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <Bar dataKey="completed" fill="hsl(var(--primary))" />
            <Bar dataKey="committed" fill="hsl(var(--muted-foreground))" />
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
            <Tooltip />
            <Legend
              wrapperStyle={{
                color: "hsl(var(--muted-foreground))",
                paddingTop: "20px",
              }}
            />
          </BarChart>
        </div>
      </div>

      <div className="text-center py-10 glass-card rounded-lg">
        <div className="flex-row items-center justify-stretch">
          <div>
            <h2 className="text-2xl font-semibold">By Category</h2>
          </div>
          {statistics?.categoryData.map((category, index) => (
            <div key={category.categoryId} className="flex justify-between py-5 px-10">
              <h1 className="text-xl font-semibold">{category.name}</h1>
              <AreaChart width={600} height={50} data={category?.data}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                />
                <Area dataKey="completed" fill="hsl(var(--primary))" />
                <Area dataKey="committed" fill="hsl(var(--muted-foreground))" />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  axisLine={{ stroke: "hsl(var(--border))" }}
                  tickLine={false}
                />
              </AreaChart>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
