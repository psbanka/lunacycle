import { useTask } from "@/contexts/TaskContext";
import { Button } from "@/components/ui/button";
import { PlusCircle, Plus } from "lucide-react";
import { LoadingScreen } from "@/components/LoadingScreen";
import { LoadIndicator } from "@/components/LoadIndicator";
import BacklogTaskCard from "@/components/BacklogTaskCard";

export default function Backlog() {
  const { backlogTasks, loadingTasks, updateTask } = useTask();

  if (loadingTasks) {
    return <LoadingScreen />;
  }
  if (!backlogTasks) return null;

  if (backlogTasks?.length === 0) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold">No Backlog Tasks!</h1>
            <div className="mb-8 flex flex-wrap gap-3">
              <Button
                variant="outline"
                className="gap-1"
                onClick={() => console.log("implement me")}>
                <PlusCircle className="h-4 w-4" />
                Add Backlog Tasks
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-row justify-between mb-8 gap-4">
        <div>
          <h1 className="text-left text-3xl font-bold">Backlog tasks</h1>
        </div>
        <LoadIndicator />
      </div>

      <h2 className="text-2xl font-semibold mb-6">Categories</h2>

      <div>
        {backlogTasks
          .sort((a, b) => a.category.name.localeCompare(b.category.name))
          .map((blt) => (
            <div className="mb-8" key={blt.category?.id}>
              <div className="mb-4 flex justify-between items-center">
                <h2 className="text-xl font-semibold">
                  {blt.category?.emoji} {blt.category?.name}
                </h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => console.log("todo")}
                  className="text-xs gap-1">
                  <Plus className="h-3.5 w-3.5" />
                  Add Task
                </Button>
              </div>

              <div className="md:glass-card md:bg-secondary/30 p-4 rounded-lg">
                {!blt.tasks || blt.tasks?.length === 0 ? (
                  <p className="text-muted-foreground text-sm">
                    No tasks in this category yet.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {blt.tasks
                      .sort((a, b) => a.title.localeCompare(b.title))
                      .map((task) => (
                        <BacklogTaskCard
                          key={task.id}
                          taskId={task.id}
                        />
                      ))}
                  </div>
                )}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
