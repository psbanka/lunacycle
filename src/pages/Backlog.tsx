import { useRef } from "react";
import { useTask } from "@/contexts/TaskContext";
import LunarPhase from "@/components/Moon";
import CategorySection from "@/components/CategorySection";
import TaskCard from "@/components/TaskCard";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import LunarCycleProgressBand from "@/components/LunarCycleProgressBand";
import { LoadingScreen } from "@/components/LoadingScreen";

export default function Backlog() {
   
  const { backlogTasks, loadingTasks } = useTask();
  const categoryRefs = useRef<(HTMLElement | null)[]>([]);

  // Function to scroll to a category
  // const scrollToCategory = (index: number) => {
  //   categoryRefs.current[index]?.scrollIntoView({ behavior: "smooth" });
  if (loadingTasks || backlogTasks == null) {
    return <LoadingScreen />;
  }

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
                onClick={() => console.log('implement me')}>
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
    <div className="max-w-6xl mx-auto pl-8">
      <div className="flex flex-row justify-between mb-8 gap-4">
        <div>
          <h1 className="text-left text-3xl font-bold">Backlog tasks</h1>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Up Next</h2>
      </div>

      <Separator className="my-8" />

      <h2 className="text-2xl font-semibold mb-6">Categories</h2>

      <div>
        {backlogTasks
          .sort((a, b) => a.category.name.localeCompare(b.category.name))
          .map((mc) => (
            <div
              key={mc?.category.id}
              id={mc?.category.id}
            >
              <CategorySection id={mc?.category.id} />
            </div>
          ))}
      </div>
    </div>
  );
}
