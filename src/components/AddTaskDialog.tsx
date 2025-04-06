
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTask } from "@/contexts/TaskContext";
import { Check, UserCircle } from "lucide-react";

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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

// Schema for task creation
const taskSchema = z.object({
  title: z.string().min(1, "Task title is required"),
  description: z.string().optional(),
  storyPoints: z.number().min(1).max(13),
  targetCount: z.number().min(1).max(31),
  assignedTo: z.array(z.string()).min(1, "At least one person must be assigned"),
});

type TaskFormValues = z.infer<typeof taskSchema>;

interface AddTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoryId: string;
}

// Available story points (Fibonacci sequence)
const STORY_POINTS = [1, 2, 3, 5, 8, 13];

// Mock users (normally would come from API)
const USERS = [
  { id: "1", name: "Admin", initials: "A" },
  { id: "2", name: "User", initials: "U" },
  { id: "3", name: "Family", initials: "F" },
];

export function AddTaskDialog({ open, onOpenChange, categoryId }: AddTaskDialogProps) {
  const { addTask } = useTask();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: "",
      description: "",
      storyPoints: 1,
      targetCount: 1,
      assignedTo: ["1"], // Default to first user
    },
  });

  const onSubmit = async (values: TaskFormValues) => {
    setIsSubmitting(true);
    
    try {
      addTask({
        title: values.title,
        description: values.description,
        storyPoints: values.storyPoints,
        targetCount: values.targetCount,
        assignedTo: values.assignedTo,
        categoryId: categoryId,
        status: "pending",
        currentCount: 0,
        isRecurring: true,
      });
      
      // Reset form and close dialog
      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to add task:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Task</DialogTitle>
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
                    {STORY_POINTS.map((points) => (
                      <Button
                        key={points}
                        type="button"
                        variant={field.value === points ? "default" : "outline"}
                        size="sm"
                        onClick={() => field.onChange(points)}
                      >
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
            
            <FormField
              control={form.control}
              name="assignedTo"
              render={() => (
                <FormItem>
                  <FormLabel>Assign to</FormLabel>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {USERS.map((user) => (
                      <FormField
                        key={user.id}
                        control={form.control}
                        name="assignedTo"
                        render={({ field }) => {
                          const isSelected = field.value?.includes(user.id);
                          return (
                            <FormItem key={user.id} className="flex items-center space-x-2 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={isSelected}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      field.onChange([...field.value, user.id]);
                                    } else {
                                      // Don't allow unchecking the last user
                                      if (field.value.length > 1) {
                                        field.onChange(field.value.filter((value) => value !== user.id));
                                      }
                                    }
                                  }}
                                />
                              </FormControl>
                              <div className="flex items-center gap-2">
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback className={isSelected ? "bg-primary text-primary-foreground" : ""}>
                                    {user.initials}
                                  </AvatarFallback>
                                </Avatar>
                                <span>{user.name}</span>
                              </div>
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
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancel</Button>
              </DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Adding..." : "Add Task"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
