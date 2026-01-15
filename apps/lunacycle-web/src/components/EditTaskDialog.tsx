import { FIBONACCI } from "@lunacycle/types";
import { useLoadable } from "atom.io/react";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { type } from "arktype";
import { arktypeResolver } from "@hookform/resolvers/arktype";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { TrendingUp, TrendingDown, Minus, Trash, Layers, Eye, EyeOff } from "lucide-react";
import { UserSelectionFormItem } from "./UserSelectionFormItem";
import { currentMonthAtom, getPlaceholderMonth } from "@/atoms";
import { GoalType } from "../../server/schema";

import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import {
  addTask,
  updateTask,
  updateTemplateTask,
  deleteTask,
  deleteTemplateTask,
  addTemplateTask,
} from "@/actions";

// Schema for task creation
export const TaskSchema = type({
  "id?": "string",
  title: "string > 0",
  "description?": "string",
  storyPoints: "0 | 1 | 2 | 3 | 5 | 8 | 13",
  targetCount: "1 <= number.integer <= 31",
  userIds: "string[] >= 1",
  monthId: "string | null",
  categoryId: "string | null",
  "goal": "string | null",
  "isFocused?": "0 | 1",
});

type TaskFormValues = typeof TaskSchema.infer;

interface EditTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoryId?: string | null;
  monthId: string | null;
  isTemplateTask: boolean;
  readOnly?: boolean;
  initialValues?: Partial<TaskFormValues>;
}

export function EditTaskDialog({
  open,
  onOpenChange,
  categoryId,
  monthId,
  isTemplateTask,
  readOnly = false,
  initialValues,
}: EditTaskDialogProps) {
  const currentMonth = useLoadable(currentMonthAtom, getPlaceholderMonth());
  const isMobile = useMediaQuery("(max-width: 640px)"); // Tailwind's 'sm' breakpoint
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditingId = initialValues?.id;
  const isEditingTask = isEditingId && categoryId;
  const isEditingTemplateTask = isEditingId && isTemplateTask;
  const isContinuingTask =
    initialValues?.targetCount && initialValues.targetCount > 1;

  const form = useForm<TaskFormValues>({
    resolver: arktypeResolver(TaskSchema),
    defaultValues: {
      title: "",
      description: "",
      storyPoints: 1,
      targetCount: 1,
      isFocused: 0,
      goal: null,
      userIds: [],
      monthId,
      categoryId,
      ...initialValues,
    },
  });

  useEffect(() => {
    // Reset the form only when the task being edited changes,
    // not on every render. We use the ID to track this.
    form.reset({
      title: "",
      description: "",
      storyPoints: 1,
      targetCount: 1,
      isFocused: 0,
      goal: null,
      userIds: [],
      monthId,
      categoryId,
      ...initialValues,
    });
  }, [initialValues?.id, monthId, categoryId, form.reset]);

  if (!categoryId || currentMonth instanceof Error) return null;

  const onSubmit = async (values: TaskFormValues) => {
    setIsSubmitting(true);
    const userIds = values.userIds;
    if (values.categoryId == null) {
      console.log('not supported with no category ID')
      return
    }
    try {
      if (isEditingId) {
        if (isTemplateTask === false) {
          await updateTask({
            task: {
              id: isEditingId,
              title: values.title,
              description: values.description || null,
              storyPoints: values.storyPoints,
              targetCount: values.targetCount,
              isFocused: values.isFocused || 0,
              monthId: values.monthId,
              categoryId: values.categoryId,
              userIds: values.userIds,
            },
          });
        } else {
          await updateTemplateTask({
            task: {
              id: isEditingId,
              title: values.title,
              description: values.description || null,
              storyPoints: values.storyPoints,
              targetCount: values.targetCount,
              categoryId: values.categoryId,
              goal: values.goal as GoalType || null,
              userIds: values.userIds,
            },
          });
        } // FIXME: THESE USE-CASES ARE BROKEN
      } else if (isTemplateTask === false) {
        await addTask({
          task: {
            title: values.title,
            description: values.description || null,
            storyPoints: values.storyPoints,
            targetCount: values.targetCount,
            categoryId: categoryId,
            monthId: monthId,
            templateTaskId: null,
            isFocused: values.isFocused || 0,
            userIds,
          },
        });
      } else {
        await addTemplateTask({
          task: {
            title: values.title,
            description: values.description || null,
            storyPoints: values.storyPoints,
            targetCount: values.targetCount,
            categoryId: values.categoryId,
            goal: values.goal as GoalType || null,
            userIds,
          },
        });
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

  const errorMessages = Object.values(form.formState.errors).map(
    (error) => error.message
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "overflow-y-auto", // Ensure content can scroll
          isMobile
            ? "h-screen w-screen max-w-full fixed top-0 left-0 m-0 p-4 rounded-none border-none translate-x-0 translate-y-0 data-[state=open]:animate-none data-[state=closed]:animate-none"
            : "sm:max-w-[425px]"
        )}>
        {/* On mobile, the DialogPrimitive.Close 'X' button (if part of base DialogContent) will be at top-right. */}
        {/* The form content will scroll within this full-screen container. */}
        <DialogHeader>
          <DialogTitle>
            <DialogDescription>
              {isEditingId ? "Edit Task" : "Add New Task"}
            </DialogDescription>
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
                    <Input disabled={readOnly} placeholder="Task title" {...field} />
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
                      disabled={readOnly}
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
                        disabled={readOnly}
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

            {isTemplateTask && (
              <div className="flex gap-2">
              <FormField
                control={form.control}
                name="targetCount"
                render={({ field: { value, onChange } }) => (
                  <FormItem className="basis-60">
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
              <FormField
                control={form.control}
                name="goal"
                render={({ field: { value, onChange } }) => (
                  <FormItem>
                    <FormControl>
                      <div className="flex gap-2 flex-wrap mt-3">
                        <Button
                          type="button"
                          variant={value == null ? "default" : "outline"}
                          className="flex items-center justify-start gap-2 h-auto p-2"
                          onClick={() => onChange(null)}
                        >
                          <Minus/>
                        </Button>
                        <Button
                          type="button"
                          variant={value === "maximize" ? "default" : "outline"}
                          className="flex items-center justify-start gap-2 h-auto p-2"
                          onClick={() => onChange("maximize")}
                        >
                          <TrendingUp/>
                        </Button>
                        <Button
                          type="button"
                          variant={value === "minimize" ? "default" : "outline"}
                          className="flex items-center justify-start gap-2 h-auto p-2"
                          onClick={() => onChange("minimize")}
                        >
                          <TrendingDown/>
                        </Button>
                      </div>
                    </FormControl>
                    <FormDescription>
                      {value === "maximize"
                        ? "much as possible"
                        : value === "minimize"
                        ? "little as possible"
                        : `Keep it steady`}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              </div>
            )}
            <UserSelectionFormItem control={form.control} name="userIds" />

            <DialogFooter className="mt-6">
              {errorMessages.length > 0 && (
                <div className="w-full text-left text-sm text-destructive space-y-1">
                  {errorMessages.map((message, index) => (
                    <p key={`error-${index}`}>{message}</p>
                  ))}
                </div>
              )}
              {isEditingId && (isTemplateTask || !isContinuingTask) && (
                <Button
                  type="button"
                  variant="destructive"
                  disabled={isSubmitting}
                  onClick={handleDelete}
                  className="mr-auto">
                  {isSubmitting ? "..." : <Trash className="h-4 w-4" />}
                </Button>
              )}

              {/* --- FOCUS BUTTON --- */}
              {isEditingId && (!isTemplateTask) && (
              <FormField
                control={form.control}
                name="isFocused"
                render={({ field }) => {
                  return (
                    <Button
                      size="sm"
                      variant={field.value === 1 ? "default" : "outline"}
                      type="button"
                      onClick={() => field.onChange(field.value === 1 ? 0 : 1)}>
                      {field.value === 1 ? (
                        <Eye className="w-4 h-4" />
                      ) : (
                        <EyeOff className="w-4 h-4" />
                      )}
                    </Button>
                  );
                }}
              />
              )}

              {/* --- BACKLOG BUTTON --- */}
              {isEditingId && (!isTemplateTask) && (
              <FormField
                control={form.control}
                name="monthId"
                render={({ field }) => {
                  return (
                    <Button
                      size="sm"
                      variant={field.value === null ? "default" : "outline"}
                      type="button"
                      onClick={() =>
                        field.onChange(
                          field.value === null ? currentMonth.value : null
                        )
                      }>
                      <Layers className="w-4 h-4" />
                    </Button>
                  );
                }}
              />
              )}

              {/* --- CLOSE BUTTON --- */}
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </DialogClose>
              {/* --- SAVE BUTTON --- */}
              {isEditingId ? (
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Updating..." : "Save"}
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
