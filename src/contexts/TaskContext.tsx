import {
  type FC,
  type ReactNode,
  createContext,
  useContext,
} from "react";
import { inferProcedureOutput } from "@trpc/server";
import type { AppRouter } from "../../server/index";

import type { User, Task, TemplateTask, TemplateCategory, Category } from "../../server/schema";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/lib/trpc";
import { useAuth } from "./AuthContext";
import { toast } from "sonner";

type CurrentMonthType = inferProcedureOutput<AppRouter["getActiveMonth"]>;
type TemplateType = inferProcedureOutput<AppRouter["getTemplate"]>;

export type UserTasks = UserTask[] | undefined;

// TODO: DELETE THIS?
export type UserTask = {
  user: { id: string };
  userId: string;
  task: Task;
  taskId: string;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  
  // Data fetching -------------------------------------------------
  const monthQueryOptions = trpc.getActiveMonth.queryOptions();
  const monthQuery = useQuery(monthQueryOptions);
  const templateQueryOptions = trpc.getTemplate.queryOptions();
  const templateQuery = useQuery(templateQueryOptions);
  const userQueryOptions = trpc.getUsers.queryOptions();
  const userQuery = useQuery(userQueryOptions);
  const getCategoriesByMonthId = trpc.getCategoriesByMonthId.queryOptions({ monthId: monthQuery.data?.id || ''});
  const getCategoriesByMonthIdQuery = useQuery(getCategoriesByMonthId);
  const getTasksByUserQueryOptions = trpc.getTasksByUserId.queryOptions({ userId: user?.id || ''});
  const getTasksByUserQuery = useQuery(getTasksByUserQueryOptions);

  // Mutations -----------------------------------------------------
  const createMonthFromTemplateOptions = trpc.createMonthFromTemplate.mutationOptions();
  const createMonthFromTemplateMutation = useMutation(createMonthFromTemplateOptions);

  const completeTaskOptions = trpc.completeTask.mutationOptions({
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: trpc.getActiveMonth.queryKey() });
      await queryClient.invalidateQueries({ queryKey: trpc.getTasksByUserId.queryKey() });
    },
  });
  const completeTaskMutation = useMutation(completeTaskOptions);

  const deleteTaskOptions = trpc.deleteTask.mutationOptions({
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: trpc.getActiveMonth.queryKey() });
      await queryClient.invalidateQueries({ queryKey: trpc.getTasksByUserId.queryKey() });
    },
  });
  const deleteTaskMutation = useMutation(deleteTaskOptions);

  const addTemplateCategoryOptions = trpc.addTemplateCategory.mutationOptions({
    onSuccess:  async() => {
      await queryClient.invalidateQueries({ queryKey: trpc.getTemplate.queryKey() });
    },
  });
  const addTemplateCategoryMutation = useMutation(addTemplateCategoryOptions);

  const updateTaskOptions = trpc.updateTask.mutationOptions({
    onSuccess:  async() => {
      await queryClient.invalidateQueries({ queryKey: trpc.getActiveMonth.queryKey() });
      await queryClient.invalidateQueries({ queryKey: trpc.getTasksByUserId.queryKey() });
    },
  });
  const updateTaskMutation = useMutation(updateTaskOptions);

  const updateTemplateTaskOptions = trpc.updateTemplateTask.mutationOptions({
    onSuccess:  async() => {
      await queryClient.invalidateQueries({ queryKey: trpc.getTemplate.queryKey() });
    },
  });
  const updateTemplateTaskMutation = useMutation(updateTemplateTaskOptions);

  const addTaskOptions = trpc.addTask.mutationOptions({
    onSuccess:  async() => {
      await queryClient.invalidateQueries({ queryKey: trpc.getActiveMonth.queryKey() });
      await queryClient.invalidateQueries({ queryKey: trpc.getTasksByUserId.queryKey() });
    },
  });
  const addTaskMutation = useMutation(addTaskOptions);

  const addTemplateTaskOptions = trpc.addTemplateTask.mutationOptions({
    onSuccess:  async() => {
      await queryClient.invalidateQueries({ queryKey: trpc.getTemplate.queryKey() });
    },
  });
  const addTemplateTaskMutation = useMutation(addTemplateTaskOptions);

  const updateCategoryOptions = trpc.updateCategory.mutationOptions({
    onSuccess:  async() => {
      await queryClient.invalidateQueries({ queryKey: trpc.getActiveMonth.queryKey() });
    },
  });
  const updateCategoryMutation = useMutation(updateCategoryOptions);

  const deleteCategoryOptions = trpc.deleteCategory.mutationOptions({
    onSuccess:  async() => {
      await queryClient.invalidateQueries({ queryKey: trpc.getActiveMonth.queryKey() });
    },
  });
  const deleteCategoryMutation = useMutation(deleteCategoryOptions);

  // Helper functions ----------------------------------------------
  const completeTask = async (taskId: string) => {
    if (monthQuery.isError || monthQuery.isLoading) return;
    const newTask = await completeTaskMutation.mutateAsync({ taskId });
    console.log(newTask);
    toast.success("Progress updated!");
  };

  const addTask = async (
    task: Omit<Task, "id" | "createdAt">,
    userIds: string[],
    categoryId: string,
  ) => {
    await addTaskMutation.mutateAsync({
      task: { ...task, categoryId, userIds: userIds },
    });
  };

  const addTemplateTask = async (
    templateTask: Omit<TemplateTask, "id" | "createdAt">,
    userIds: string[],
    templateCategoryId: string,
  ) => {
    await addTemplateTaskMutation.mutateAsync({
      task: { ...templateTask, templateCategoryId, userIds: userIds },
    });
    toast.success("Task added successfully!");
  };

  const updateTask = async (
    taskId: string,
    updates: Omit<Task, "completedCount" | "id">,
    categoryId: string,
    userIds: string[]
  ) => {
    await updateTaskMutation.mutateAsync({
      task: { ...updates, id: taskId, userIds, categoryId },
    });
    toast.success("Task updated!");
  };

  const updateTemplateTask = async (
    templateTaskId: string,
    updates: Omit<TemplateTask, "id">,
    templateCategoryId: string,
    userIds: string[]
  ) => {
    await updateTemplateTaskMutation.mutateAsync({
      task: { ...updates, id: templateTaskId, userIds, templateCategoryId },
    });
    toast.success("Template task updated!");
  };

  const deleteTask = async (taskId: string) => {
    await deleteTaskMutation.mutateAsync({ taskId });
    toast.success("Task deleted!");
  };

  const addTemplateCategory = async (templateCategory: Omit<TemplateCategory, "id" | "tasks">) => {
    await addTemplateCategoryMutation.mutateAsync({ templateCategory });
    toast.success("Category added!");
  };

  const updateCategory = async (
    categoryId: string,
    updates: Omit<Category, "tasks">
  ) => {
    await updateCategoryMutation.mutateAsync({
      name: updates.name,
      description: updates.description,
      id: categoryId,
    });
    toast.success("Category updated!");
  };

  const deleteCategory = async (categoryId: string) => {
    await deleteCategoryMutation.mutateAsync({ id: categoryId });
    toast.success("Category deleted!");
  };

  return (
    <TaskContext.Provider
      value={{
        currentMonth: monthQuery.data,
        users: userQuery.data,
        categories: getCategoriesByMonthIdQuery.data,
        tasksByUser: getTasksByUserQuery.data,
        template: templateQuery.data,
        loadingTasks: monthQuery.isLoading,
        createMonthFromTemplate: createMonthFromTemplateMutation.mutate,
        completeTask,
        addTask,
        addTemplateTask,
        updateTask,
        updateTemplateTask,
        deleteTask,
        addTemplateCategory,
        updateCategory,
        deleteCategory,
      }}>
      {children}
    </TaskContext.Provider>
  );
};

type TaskContextType = {
  currentMonth: CurrentMonthType | undefined;
  users: User[] | undefined;
  categories: Category[] | undefined;
  tasksByUser: Task[] | undefined;
  template: TemplateType | undefined;

  // FIXME: Rename to 'loadingData'
  loadingTasks: boolean;
  createMonthFromTemplate: () => void;
  completeTask: (taskId: string) => void;
  addTask: (
    task: Omit<Task, "id" | "createdAt">,
    userIds: string[],
    categoryId: string,
  ) => void;
  addTemplateTask: (
    templateTask: Omit<TemplateTask, "id" | "createdAt">,
    userIds: string[],
    categoryId: string,
  ) => void;
  updateTask: (
    taskId: string,
    updates: Omit<Task, "completedCount" | "id">,
    categoryId: string,
    userIds: string[]
  ) => void;
  updateTemplateTask: (
    templateTaskId: string,
    updates: Omit<TemplateTask, "completedCount" | "id">,
    templateCategoryId: string,
    userIds: string[]
  ) => void;
  deleteTask: (taskId: string) => void;
  addTemplateCategory: (category: Omit<Category, "id" | "tasks">) => void;
  updateCategory: (
    categoryId: string,
    updates: Omit<Category, "tasks">
  ) => void;
  deleteCategory: (categoryId: string) => void;
};

export const useTask = () => {
  const context = useContext(TaskContext);
  if (context === undefined) {
    throw new Error("useTask must be used within a TaskProvider");
  }
  return context;
};
