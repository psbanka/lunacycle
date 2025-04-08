import {
  type FC,
  type ReactNode,
  createContext,
  useState,
  useContext,
  useEffect,
} from "react";
import { Template, Category, MonthData, Task } from "@/types";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTRPC } from "@/lib/trpc";
import { useAuth } from "./AuthContext";
import { toast } from "sonner";

type TaskContextType = {
  currentMonth: MonthData | undefined;
  template: Template | undefined;
  categories: Category[];

  loadingTasks: boolean;
  completeTask: (taskId: string) => void;
  // incrementTaskCount: (taskId: string) => void;
  addTask: (task: Omit<Task, "id" | "createdAt">, categoryId: string) => void;
  updateTask: (taskId: string, updates: Omit<Task, "id">, categoryId: string) => void;
  deleteTask: (taskId: string) => void;
  addCategory: (category: Omit<Category, "id" | "tasks">) => void;
  updateCategory: (
    categoryId: string,
    updates: Omit<Category, "tasks">
  ) => void;
  deleteCategory: (categoryId: string) => void;
};

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const trpc = useTRPC();
  const monthQueryOptions = trpc.getCurrentMonth.queryOptions();
  const monthQuery = useQuery(monthQueryOptions);
  const templateQueryOptions = trpc.getTemplate.queryOptions();
  const templateQuery = useQuery(templateQueryOptions);

  const completeTaskOptions = trpc.completeTask.mutationOptions();
  const completeTaskMutation = useMutation(completeTaskOptions);
  const deleteTaskOptions = trpc.deleteTask.mutationOptions();
  const deleteTaskMutation = useMutation(deleteTaskOptions);
  const addCategoryOptions = trpc.addCategory.mutationOptions();
  const addCategoryMutation = useMutation(addCategoryOptions);
  const updateTaskOptions = trpc.updateTask.mutationOptions();
  const updateTaskMutation = useMutation(updateTaskOptions);
  const addTaskOptions = trpc.addTask.mutationOptions();
  const addTaskMutation = useMutation(addTaskOptions);
  const updateCategoryOptions = trpc.updateCategory.mutationOptions();
  const updateCategoryMutation = useMutation(updateCategoryOptions);
  const deleteCategoryOptions = trpc.deleteCategory.mutationOptions();
  const deleteCategoryMutation = useMutation(deleteCategoryOptions);

  const completeTask = async (taskId: string) => {
    if (monthQuery.isError || monthQuery.isLoading) return;
    const newTask = await completeTaskMutation.mutate({ taskId });
    console.log(newTask);
    toast.success("Progress updated!");
  };

  const addTask = async (
    task: Omit<Task, "id" | "createdAt">,
    categoryId: string
  ) => {
    const userIds = task.assignedTo.map((user) => user.id);
    await addTaskMutation.mutate({
      task: { ...task, categoryId, assignedTo: userIds },
    });
    toast.success("Task added successfully!");
  };

  const updateTask = async (taskId: string, updates: Omit<Task, "id">, categoryId: string) => {
    const userIds = updates.assignedTo.map((user) => user.id);
    await updateTaskMutation.mutate({
      task: { ...updates, id: taskId, assignedTo: userIds, categoryId },
    });
    toast.success("Task updated!");
  };

  const deleteTask = async (taskId: string) => {
    await deleteTaskMutation.mutate({ taskId });
    toast.success("Task deleted!");
  };

  const addCategory = async (category: Omit<Category, "id" | "tasks">) => {
    await addCategoryMutation.mutate({ category });
    toast.success("Category added!");
  };

  const updateCategory = async (
    categoryId: string,
    updates: Omit<Category, "tasks">
  ) => {
    await updateCategoryMutation.mutate({
      name: updates.name,
      description: updates.description,
      id: categoryId,
    });
    toast.success("Category updated!");
  };

  const deleteCategory = async (categoryId: string) => {
    await deleteCategoryMutation.mutate({ id: categoryId });
    toast.success("Category deleted!");
  };

  const userTasks =
    monthQuery.data?.categories.flatMap((category) => category.tasks) ?? [];
  const categories = monthQuery.data?.categories ?? [];

  return (
    <TaskContext.Provider
      value={{
        currentMonth: monthQuery.data,
        template: templateQuery.data,
        categories,
        loadingTasks: monthQuery.isLoading,
        completeTask,
        // incrementTaskCount,
        addTask,
        updateTask,
        deleteTask,
        addCategory,
        updateCategory,
        deleteCategory,
      }}>
      {children}
    </TaskContext.Provider>
  );
};

export const useTask = () => {
  const context = useContext(TaskContext);
  if (context === undefined) {
    throw new Error("useTask must be used within a TaskProvider");
  }
  return context;
};
