
import React, { useState, useEffect } from "react";
import { useTask } from "@/contexts/TaskContext";
import { useAuth } from "@/contexts/AuthContext";
import useLunarPhase from "@/hooks/useLunarPhase";
import type { Task } from "../../server/schema";
import { Button } from "@/components/ui/button";
import { Printer, Save } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import LunarPhase from "@/components/Moon";
import { toast } from "sonner";

type RatingInputProps = {
  label: string;
  value: number;
  onChange: (value: number) => void;
};

const RatingInput = ({ label, value, onChange }: RatingInputProps) => {
  return (
    <div className="space-y-2 w-full">
      <div className="flex justify-between items-center">
        <label htmlFor={label.toLowerCase()} className="text-sm font-medium">
          {label} (1-5)
        </label>
        <span className="text-sm font-semibold">{value}</span>
      </div>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((rating) => (
          <Button
            key={rating}
            type="button"
            size="sm"
            variant={value === rating ? "default" : "outline"}
            className="flex-1 h-8"
            onClick={() => onChange(rating)}
          >
            {rating}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default function CheckInSheet() {
  const { loadingTasks, categories, currentMonth, currentTasks } = useTask();
  const { user } = useAuth();
  const { daysRemaining } = useLunarPhase();

  // Form state
  const [gratitude, setGratitude] = useState("");
  const [notes, setNotes] = useState("");
  const [workingOn, setWorkingOn] = useState("");
  const [needs, setNeeds] = useState("");
  const [dreams, setDreams] = useState("");
  const [happiness, setHappiness] = useState(3);
  const [health, setHealth] = useState(3);
  const [stress, setStress] = useState(3);

  const handlePrint = () => {
    window.print();
  };

  const handleSave = () => {
    // This would typically save to a database via an API
    // For now, we'll just show a success toast
    toast.success("Not implemented.");
  };

  if (!categories || !currentTasks) return null

  if (loadingTasks || !currentMonth) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <div className="text-center">
          <LunarPhase size="lg" />
          <p className="mt-4 text-muted-foreground">Loading your tasks...</p>
        </div>
      </div>
    );
  }

  const getCategoryStatus = (categoryId: string) => {
    const category = categories.find(c => c?.id === categoryId);
    if (!category) return null;

    if (!category) return null;

    const totalTasks = currentTasks.length;
    
    if (totalTasks === 0) return null;
    
    /*
    const completedTasks = tasks.filter((t) => t.targetCount === t.completedCount).length;
    const recurringTasks = tasks.filter((t) => t.targetCount > 1);
    */
    const completedTasks = 0
    const recurringTasks = []
    
    // Check if any recurring tasks are behind schedule
    const behindScheduleTasks = recurringTasks.filter((task) => {
      // If we have more than 0 days remaining
      if (daysRemaining <= 0) return false;
      
      /*
      const remainingCount = task.targetCount - task.completedCount;
      */
      const remainingCount = 1
      const daysPerRemaining = daysRemaining / remainingCount;
      
      // If we need to do more than one every other day, we're behind
      return daysPerRemaining < 2;
    });

    const status = {
      totalTasks,
      completedTasks,
      completion: Math.round((completedTasks / totalTasks) * 100),
      behindScheduleTasks
    };

    return status;
  };

  const getCategoryTasks = (categoryId: string | undefined) => {
    if (!categoryId) return [];
    return currentTasks.filter(task => {
      if (user == null) return false;
      const userIds = task.taskUsers.map(tu => tu.userId);
      if (task.completedCount === task.targetCount) return false;
      return userIds.includes(user.id) && task.categoryId === categoryId;
    });
  };

  return (
    <div className="h-[95vh] w-full overflow-y-auto">
      <div className="w-full max-w-4xl mx-auto py-6 print:p-0">
        <div className="mb-8">
          <div className="flex justify-between items-center print:hidden">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-1"
                onClick={handleSave}
              >
                <Save className="h-4 w-4" />
                Save
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1"
                onClick={handlePrint}
              >
                <Printer className="h-4 w-4" />
                Print
              </Button>
            </div>
          </div>
          <h3 className="print:hidden">
            Review your progress and reflect on your journey this lunar cycle.
          </h3>
        </div>

        {/* Printable Content */}
        <div className="space-y-8 print:text-black">
          {/* Header for print */}
          <div className="hidden print:flex justify-between items-center">
            <h1 className="text-3xl font-bold">Check-in Sheet</h1>
            <div className="flex items-center gap-2">
              <LunarPhase size="md" showLabel={false} />
              <div>
                <p className="text-lg font-semibold">{currentMonth.name}</p>
                <p>{daysRemaining} days remaining</p>
              </div>
            </div>
          </div>

          {/* Current Status Section */}
          <section>
            <div className="p-6 rounded-lg glass-card m-6">
              {categories.map((category) => {
                const status = getCategoryStatus(category?.id);
                if (!status) return null;
                
                return (
                  <div 
                    key={category?.id} 
                    className="glass-card w-full p-4 m-6 rounded-lg print:border print:border-gray-300 print:rounded"
                  >
                    <h3 className="font-semibold mb-2">{category?.emoji}&nbsp;{category?.name}</h3>
                    
                    <div className="space-y-2 text-sm">
                      <p>
                        <span className="text-muted-foreground print:text-gray-700">Completion:</span>{" "}
                        {status.completion}% ({status.completedTasks}/{status.totalTasks} tasks)
                      </p>
                      
                      <ul className="list-none space-y-1 mt-2">
                        {getCategoryTasks(category?.id).map((task: Task) => (
                          <li key={task.id} className="flex items-start text-left">
                            <span className="mr-2 mt-1 text-muted-foreground">☐</span>
                            <span>{task.title} {task.targetCount > 1 ? `(${task.completedCount}/${task.targetCount})` : null }</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <Separator />

          {/* Reflection Section */}
          <section>
            <h2 className="text-xl font-semibold mb-4 print:text-black">Reflection & Notes</h2>
            
            <div className="space-y-6">
              <div>
                <label htmlFor="gratitude" className="block text-sm font-medium mb-2">
                  What are you grateful for this week?
                </label>
                <Textarea
                  id="gratitude"
                  placeholder="List three things you're grateful for..."
                  className="min-h-[100px] print:border print:border-gray-300"
                  value={gratitude}
                  onChange={(e) => setGratitude(e.target.value)}
                />
              </div>
              
              <div>
                <label htmlFor="working-on" className="block text-sm font-medium mb-2">
                  What are you currently working on?
                </label>
                <Textarea
                  id="working-on"
                  placeholder="What projects or goals are you focused on right now?"
                  className="min-h-[80px] print:border print:border-gray-300"
                  value={workingOn}
                  onChange={(e) => setWorkingOn(e.target.value)}
                />
              </div>
              
              <div>
                <label htmlFor="needs" className="block text-sm font-medium mb-2">
                  What do you need right now?
                </label>
                <Textarea
                  id="needs"
                  placeholder="Support, resources, time...?"
                  className="min-h-[80px] print:border print:border-gray-300"
                  value={needs}
                  onChange={(e) => setNeeds(e.target.value)}
                />
              </div>
              
              <div>
                <label htmlFor="dreams" className="block text-sm font-medium mb-2">
                  Recent dreams or inspirations:
                </label>
                <Textarea
                  id="dreams"
                  placeholder="Note any significant dreams or creative ideas you've had..."
                  className="min-h-[80px] print:border print:border-gray-300"
                  value={dreams}
                  onChange={(e) => setDreams(e.target.value)}
                />
              </div>
              
              <div>
                <label htmlFor="notes" className="block text-sm font-medium mb-2">
                  General notes:
                </label>
                <Textarea
                  id="notes"
                  placeholder="Any additional thoughts or observations..."
                  className="min-h-[100px] print:border print:border-gray-300"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>
          </section>

          <Separator />

          {/* Ratings Section */}
          <section>
            <h2 className="text-xl font-semibold mb-4 print:text-black">Well-being Check</h2>
            
            <div className="space-y-4">
              <RatingInput 
                label="Happiness" 
                value={happiness} 
                onChange={setHappiness} 
              />
              
              <RatingInput 
                label="Health" 
                value={health} 
                onChange={setHealth} 
              />
              
              <RatingInput 
                label="Stress" 
                value={stress} 
                onChange={setStress} 
              />
            </div>
          </section>

          {/* Print-friendly elements */}
          <div className="hidden print:block text-xs text-gray-400 mt-12 border-t pt-4">
            <p>Generated on {new Date().toLocaleDateString()} • {currentMonth.name}</p>
          </div>

        </div>
      </div>
    </div>
  );
}


/*
                          <p className="font-medium">Needs attention:</p>
                          <ul className="list-disc list-inside pl-2">
                            {status.behindScheduleTasks.map((task) => (
                              <li key={task.id}>
                                {task.title}: {task.completedCount}/{task.targetCount} times
                                {daysRemaining > 0 && (
                                  <span>
                                    {" "}
                                    (need {Math.ceil((task.targetCount - task.completedCount) / daysRemaining)} per day)
                                  </span>
                                )}
                              </li>
                            ))}
                          </ul>
                          */