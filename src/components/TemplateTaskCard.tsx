import {
  TemplateTask,
  TemplateTaskUser,
  User,
} from "../../server/schema";
import { useState } from "react";
import { EditTaskDialog } from "./EditTaskDialog";
import { UserAvatar } from "./UserAvatar";

type TemplateTaskCardProps = {
  templateTask: TemplateTask & {
    templateTaskUsers: Array<TemplateTaskUser & { user: User }>;
  };
  className?: string; // FIXME: USED?
};

export function TemplateTaskCard( props : TemplateTaskCardProps) {
  const { templateTask } = props;
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const handleEditClick = () => {
    setIsEditDialogOpen(true);
  };

  return (
    <>
      <div
        key={templateTask.id}
        className="glass-card p-4 rounded-lg cursor-pointer"
        onClick={handleEditClick}
      >
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
              <UserAvatar
                key={ttu.userId}
                user={ttu.user}
                dimmed={true}
              />
            );
          })}
        </div>
      </div>

      {/* Edit Dialog */}
      <EditTaskDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        monthId={null}
        isTemplateTask={true}
        initialValues={{
          id: templateTask.id,
          title: templateTask.title,
          description: templateTask.description || "",
          storyPoints: templateTask.storyPoints,
          targetCount: templateTask.targetCount,
          categoryId: templateTask.categoryId,
          userIds: templateTask.templateTaskUsers.map((ttu) => ttu.userId),
        }}
      />
    </>
  );
}
