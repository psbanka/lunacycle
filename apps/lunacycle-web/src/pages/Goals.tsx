import { Activity } from "lucide-react";
import { useState, useEffect } from "react";
import { useLoadable } from "atom.io/react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Legend,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { LoadingScreen } from "@/components/LoadingScreen";
import { Button } from "@/components/ui/button";
import RecurringTaskGoal from "@/components/RecurringTaskGoal";
import { inferProcedureOutput } from "@trpc/server";
import type { AppRouter } from "../../server/index";
import type { TemplateTask } from "../../server/schema";
import { statisticsAtom } from "@/atoms"
import { startCycle } from "@/actions";

const PLANNING = true;

function getTaskIds(
  statistics: inferProcedureOutput<AppRouter["getStatistics"]> | undefined
) {
  if (!statistics) return [];
  return Object.values(statistics.categoryData)
    .flatMap((cd) => Object.values(cd.recurringTaskInfo ?? {}))
    .flatMap((rtd) => rtd.templateTask.id);
}

type CommittedTask = {
  id: string;
  title: string;
  targetCount: number;
};

export default function Goals() {
  const statistics = useLoadable(statisticsAtom)
  const [committedTasks, setCommittedTasks] = useState<CommittedTask[]>([]);

  if (statistics === "LOADING") {
    return <LoadingScreen />;
  }
  if (statistics.value instanceof Error) return null

  function handleToggleCommitted(templateTaskId: string, templateTask: TemplateTask, targetCount: number) {
    if (committedTasks.find((c) => c.id === templateTaskId)) {
      setCommittedTasks((prev) => prev.filter((c) => c.id !== templateTaskId));
    } else {
      setCommittedTasks((prev) => [
        ...prev,
        { id: templateTaskId, title: templateTask.title, targetCount },
      ]);
    }
  }

  async function handleStartCycle() {
    const backlogTasks = [];
    await startCycle({ recurringTasks: committedTasks, backlogTasks });
    setCommittedTasks([]);
  }

  async function handleCommitAll() {
    if (statistics === "LOADING") return;
    if (statistics.value instanceof Error) return;
    statistics.value.categoryData.forEach((category) => {
      const recurringTasks = category.recurringTaskInfo ?? {}
      Object.entries(recurringTasks).map(([key, recurringTask]) => handleToggleCommitted(
        key,
        recurringTask.templateTask,
        recurringTask.templateTask.targetCount
      ));
    });
  }

  const totalTasksCount = getTaskIds(statistics.value).length;
  const readyToStartCycle = totalTasksCount === committedTasks.length;
  const allVariant = readyToStartCycle ? "destructive" : "outline";

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-row justify-between mb-8 gap-4">
        {PLANNING ? (
          <div>
            <div className="flex flex-row justify-between gap-4 align-center">
              <h1 className="text-left text-3xl font-bold">Commit</h1>
              <Button
                disabled={!readyToStartCycle}
                onClick={handleStartCycle}
                variant={allVariant}>
                Start Cycle
              </Button>
            </div>
            <p className="text-muted-foreground">
              Set and track the coming cycle!
            </p>
          </div>
        ) : (
          <div>
            <h1 className="text-left text-3xl font-bold">Goals</h1>
            <p className="text-muted-foreground">
              Review your long-term goals.
            </p>
          </div>
        )}
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
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={statistics.value.overall}>
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
          </ResponsiveContainer>
        </div>
      </div>

      <div className="text-center my-10 py-10 glass-card rounded-lg">
        <div className="flex-row items-center justify-stretch">
          <div className="flex flex-row items-center justify-center">
            <h2 className="text-2xl font-semibold mr-5">By Category</h2>
            <Button
              onClick={handleCommitAll}>
              Commit all
            </Button>
          </div>
          <div className="mt-6 space-y-8">
            {statistics.value.categoryData.map((category) => (
              <div key={category.categoryId}>
                <div className="flex justify-between items-center py-5 px-10">
                  <h3 className="text-xl font-semibold">{category.name}</h3>
                  <LineChart width={400} height={40} data={category?.data}>
                    <Line
                      type="monotone"
                      dataKey="completed"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </div>
                {category.recurringTaskInfo && (
                  <div className="px-10 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(category.recurringTaskInfo).map(
                      ([key, recurringTask]) => (
                        <RecurringTaskGoal
                          key={key}
                          recurringTask={recurringTask}
                          committed={
                            committedTasks.find(
                              (ct) => ct.id === key
                            ) != null
                          }
                          toggleCommitted={(targetCount: number) =>
                            handleToggleCommitted(
                              key,
                              recurringTask.templateTask,
                              targetCount
                            )
                          }
                          planning={PLANNING}
                        />
                      )
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
