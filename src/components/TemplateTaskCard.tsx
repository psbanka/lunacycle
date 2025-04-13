import type { Task, Category } from "../../server/schema";
import { useTask, type UserTask } from "@/contexts/TaskContext";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { Calendar, CheckCircle, CheckSquare, Clock, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  type TemplateCategoryTemplateTask,
  TemplateTask,
  TemplateTaskUser,
  User,
} from "../../server/schema";

type TemplateTaskCardProps = {
  templateCategoryTemplateTask: TemplateCategoryTemplateTask & {
    templateTask: TemplateTask & {
      templateTaskUsers: Array<TemplateTaskUser & { user: User }>;
    };
  };
  className?: string;
};

export function TemplateTaskCard({
  templateCategoryTemplateTask,
  className,
}: TemplateTaskCardProps) {
  const { templateTask, templateTaskId } = templateCategoryTemplateTask;
  return (
    <div key={templateTaskId} className="glass-card p-4 rounded-lg">
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-medium">{templateTask.title}</h3>
        <div className="bg-primary/10 text-primary px-2 py-0.5 rounded text-xs">
          {templateTask.storyPoints} SP
        </div>
      </div>

      <div className="text-sm text-muted-foreground">
        {templateTask.targetCount > 1 ? (
          <p>Do {templateTask.targetCount} times per month</p>
        ) : (
          <p>One-time task</p>
        )}
      </div>

      <div className="mt-2 flex gap-1">
        {templateTask.templateTaskUsers.map((ttu) => {
          return (
            <div
              key={ttu.user?.id}
              className="bg-accent text-xs px-2 py-0.5 rounded-full">
              {ttu.user?.name}
            </div>
          );
        })}
      </div>
    </div>
  );
}
