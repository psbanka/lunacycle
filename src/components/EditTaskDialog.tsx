import { FIBONACCI } from "../../shared/types";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { type } from "arktype";
import { arktypeResolver } from "@hookform/resolvers/arktype"
import { LoadingScreen } from "./LoadingScreen";

import { useTask } from "@/contexts/TaskContext";
import { Trash } from "lucide-react";
import { UserAvatar } from "@/components/UserAvatar";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar } from "@/components/ui/avatar";


// Schema for task creation
const TaskSchema = type({
  "id?": "string",
  title: "string > 0",
  description: "string",
  storyPoints: "1 | 2 | 3 | 5 | 8 | 13 | 21",
  targetCount: "1 <= number.integer <= 31",
  "completedCount?": "number",
  userIds: "string[] >= 1",
  "isFocused?": "0 | 1",
});

type TaskFormValues = typeof TaskSchema.infer;

interface EditTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoryId?: string;
  templateCategoryId?: string;
  initialValues?: Partial<TaskFormValues>;
}

export function EditTaskDialog({
  open,
  onOpenChange,
  categoryId,
  templateCategoryId,
  initialValues,
}: EditTaskDialogProps) {
  const {
    addTask,
    updateTask,
    updateTemplateTask,
    addTemplateTask,
    users,
    deleteTask,
    deleteTemplateTask,
  } = useTask();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditingId = initialValues?.id;
  const isEditingTask = isEditingId && categoryId;
  const isEditingTemplateTask = isEditingId && templateCategoryId;
  const isTemplateTask = !!templateCategoryId;
  const isContinuingTask =
    initialValues?.targetCount && initialValues.targetCount > 1;

  const form = useForm<TaskFormValues>({
    resolver: arktypeResolver(TaskSchema),
    defaultValues: {
      title: "",
      description: "",
      storyPoints: 1,
      targetCount: 1,
      completedCount: 0,
      isFocused: 0,
      userIds: [],
      ...initialValues,
    },
  });

  if (!categoryId && !templateCategoryId) return null;

  const onSubmit = async (values: TaskFormValues) => {
    setIsSubmitting(true);
    const userIds = values.userIds;
    try {
      if (isEditingId && categoryId) {
        await updateTask(
          isEditingId,
          {
            title: values.title,
            description: values.description || null,
            storyPoints: values.storyPoints as (typeof FIBONACCI)[number], // FIXME
            targetCount: values.targetCount,
            completedCount: values.completedCount || 0,
            isFocused: values.isFocused || 0,
            templateTaskId: null,
          },
          categoryId,
          values.userIds
        );
      } else if (isEditingId && templateCategoryId) {
        await updateTemplateTask(
          isEditingId,
          {
            title: values.title,
            description: values.description || null,
            storyPoints: values.storyPoints as (typeof FIBONACCI)[number], // FIXME
            targetCount: values.targetCount,
          },
          templateCategoryId,
          values.userIds
        );
      } else if (categoryId) {
        await addTask(
          {
            title: values.title,
            description: values.description || null,
            storyPoints: values.storyPoints as (typeof FIBONACCI)[number], // FIXME
            targetCount: values.targetCount,
            isFocused: values.isFocused || 0,
            completedCount: 0,
          },
          userIds,
          categoryId
        );
      } else if (templateCategoryId) {
        await addTemplateTask(
          {
            title: values.title,
            description: values.description || null,
            storyPoints: values.storyPoints as (typeof FIBONACCI)[number], // FIXME
            targetCount: values.targetCount,
          },
          userIds,
          templateCategoryId
        );
      }

      // Reset form and close dialog
      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to add task:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!isEditingId) return;

    setIsSubmitting(true);
    try {
      if (isEditingTemplateTask) {
        await deleteTemplateTask(isEditingId);
      } else if (isEditingTask) {
        await deleteTask(isEditingId);
      }
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to delete task:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!users) {
    return <LoadingScreen />;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEditingId ? "Edit Task" : "Add New Task"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Task title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe this task..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="storyPoints"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Story Points</FormLabel>
                  <div className="flex gap-2 flex-wrap">
                    {FIBONACCI.map((points) => (
                      <Button
                        key={points}
                        type="button"
                        variant={field.value === points ? "default" : "outline"}
                        size="sm"
                        onClick={() => field.onChange(points)}>
                        {points}
                      </Button>
                    ))}
                  </div>
                  <FormDescription>
                    Select the complexity level (1 is easiest, 13 is hardest)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {templateCategoryId && (
              <FormField
                control={form.control}
                name="targetCount"
                render={({ field: { value, onChange } }) => (
                  <FormItem>
                    <FormLabel>Times per month: {value}</FormLabel>
                    <FormControl>
                      <Slider
                        min={1}
                        max={31}
                        step={1}
                        value={[value]}
                        onValueChange={(vals) => onChange(vals[0])}
                      />
                    </FormControl>
                    <FormDescription>
                      {value === 1
                        ? "Do once per month"
                        : value === 31
                        ? "Do every day"
                        : `Do ${value} times per month`}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {isEditingTask && initialValues?.targetCount === 1 && (
              <FormField
                control={form.control}
                name="completedCount"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel>Completed</FormLabel>
                      <FormDescription>
                        Mark this task as complete
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Checkbox
                        checked={field.value === 1}
                        onCheckedChange={(checked) => {
                          field.onChange(checked ? 1 : 0);
                        }}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            )}

            {isEditingTask &&
              initialValues?.targetCount &&
              initialValues.targetCount > 1 && (
                <FormField
                  control={form.control}
                  name="completedCount"
                  render={({ field: { value, onChange } }) => (
                    <FormItem>
                      <FormLabel>Completed Count: {value}</FormLabel>
                      <FormControl>
                        <Slider
                          min={0}
                          max={initialValues.targetCount}
                          step={1}
                          value={[value ?? 0]}
                          onValueChange={(vals) => onChange(vals[0])}
                        />
                      </FormControl>
                      <FormDescription>
                        Set the number of times this task has been completed.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

            <FormField
              control={form.control}
              name="userIds"
              render={() => (
                <FormItem>
                  <FormLabel>Assign to</FormLabel>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {users.map((user) => (
                      <FormField
                        key={user.id}
                        control={form.control}
                        name="userIds"
                        render={({ field }) => {
                          const isSelected = field.value?.includes(user.id);
                          return (
                            <FormItem
                              key={user.id}
                              className="flex items-center space-x-2 space-y-0">
                              <FormControl>
                                <Checkbox
                                  id={`checkbox-${user.id}`}
                                  checked={isSelected}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      field.onChange([...field.value, user.id]);
                                    } else {
                                      // Don't allow unchecking the last user
                                      if (field.value.length > 1) {
                                        field.onChange(
                                          field.value.filter(
                                            (value) => value !== user.id
                                          )
                                        );
                                      }
                                    }
                                  }}
                                />
                              </FormControl>
                              <label htmlFor={`checkbox-${user.id}`} className="flex items-center gap-2">
                                <Avatar className="h-8 w-8">
                                  <UserAvatar
                                    key={user.id}
                                    user={user}
                                    dimmed={true}
                                  />
                                </Avatar>
                                <span>{user.name}</span>
                              </label>
                            </FormItem>
                          );
                        }}
                      />
                    ))}
                  </div>
                  <FormDescription>
                    Select at least one person to assign this task to
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="mt-6">
              {isEditingId && (isTemplateTask || !isContinuingTask) && (
                <Button
                  type="button"
                  variant="destructive"
                  disabled={isSubmitting}
                  onClick={handleDelete}
                  className="mr-auto">
                  {isSubmitting ? (
                    "Deleting..."
                  ) : (
                    <>
                      <Trash className="h-4 w-4 mr-2" /> Delete Task
                    </>
                  )}
                </Button>
              )}
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </DialogClose>
              {isEditingId ? (
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting
                    ? "Updating..."
                    : categoryId
                    ? "Edit Task"
                    : "Edit Template Task"}
                </Button>
              ) : (
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting
                    ? "Adding..."
                    : categoryId
                    ? "Add Task"
                    : "Add Template Task"}
                </Button>
              )}
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
