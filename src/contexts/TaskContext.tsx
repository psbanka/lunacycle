/* eslint-disable react-refresh/only-export-components */
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

export type CurrentMonthType = inferProcedureOutput<AppRouter["getActiveMonth"]>;
type TemplateType = inferProcedureOutput<AppRouter["getTemplate"]>;

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

  // Clearing the cache --------------------------------------------
  type CacheCategory = "month" | "tasks" | "template" | "users" | "categories";
  async function clearCache(categories: CacheCategory[]) {
    if (monthQuery.isError || monthQuery.isLoading) return;
    for (const category of categories) {
      switch (category) {
        case "month":
          await queryClient.invalidateQueries({ queryKey: trpc.getActiveMonth.queryKey() });
          break;
        case "tasks":
          await queryClient.invalidateQueries({ queryKey: trpc.getTasksByUserId.queryKey() });
          break;
        case "template":
          await queryClient.invalidateQueries({ queryKey: trpc.getTemplate.queryKey() });
          break;
        case "users":
          await queryClient.invalidateQueries({ queryKey: trpc.getUsers.queryKey() });
          break;
        case "categories":
          await queryClient.invalidateQueries({ queryKey: trpc.getCategoriesByMonthId.queryKey() });
          break;
        default:
          break;
      }
    }
  }

  // Mutations -----------------------------------------------------
  const createMonthFromTemplateOptions = trpc.createMonthFromTemplate.mutationOptions();
  const createMonthFromTemplateMutation = useMutation(createMonthFromTemplateOptions);

  const completeTaskOptions = trpc.completeTask.mutationOptions({
    onSuccess: async () => clearCache(["month", "tasks"])
  });
  const completeTaskMutation = useMutation(completeTaskOptions);

  const deleteTaskOptions = trpc.deleteTask.mutationOptions({
    onSuccess: async () => clearCache(["month", "tasks"]),
  });
  const deleteTaskMutation = useMutation(deleteTaskOptions);
  const deleteTemplateTaskOptions = trpc.deleteTemplateTask.mutationOptions({
    onSuccess: async () => clearCache(["month", "tasks", "template"]),
  });
  const deleteTemplateTaskMutation = useMutation(deleteTemplateTaskOptions);

  const addTemplateCategoryOptions = trpc.addTemplateCategory.mutationOptions({
    onSuccess: async () => clearCache(["template"]),
  });
  const addTemplateCategoryMutation = useMutation(addTemplateCategoryOptions);

  const updateTaskOptions = trpc.updateTask.mutationOptions({
    onSuccess: async () => clearCache(["month", "tasks"]),
  });
  const updateTaskMutation = useMutation(updateTaskOptions);

  const updateTemplateTaskOptions = trpc.updateTemplateTask.mutationOptions({
    onSuccess: async () => clearCache(["template"]),
  });
  const updateTemplateTaskMutation = useMutation(updateTemplateTaskOptions);

  const addTaskOptions = trpc.addTask.mutationOptions({
    onSuccess: async () => clearCache(["month", "tasks"]),
  });
  const addTaskMutation = useMutation(addTaskOptions);

  const addTemplateTaskOptions = trpc.addTemplateTask.mutationOptions({
    onSuccess: async () => clearCache(["template"]),
  });
  const addTemplateTaskMutation = useMutation(addTemplateTaskOptions);

  const updateCategoryOptions = trpc.updateCategory.mutationOptions({
    onSuccess: async () => clearCache(["month", "tasks"]),
  });
  const updateCategoryMutation = useMutation(updateCategoryOptions);

  const deleteCategoryOptions = trpc.deleteCategory.mutationOptions({
    onSuccess: async () => clearCache(["month", "tasks"]),
  });
  const deleteCategoryMutation = useMutation(deleteCategoryOptions);

  const updateUserOptions = trpc.updateUser.mutationOptions({
    onSuccess: async () => clearCache(["month", "tasks", "users", "template", "categories"]),
  });
  const updateUserMutation = useMutation(updateUserOptions);
  
  const uploadAvatarOptions = trpc.uploadAvatar.mutationOptions({
    onSuccess: async () => clearCache(["month", "tasks"]),
  });
  const uploadAvatarMutation = useMutation(uploadAvatarOptions);
  
  const generateNewAvatarOptions = trpc.generateNewAvatar.mutationOptions({
    onSuccess: async () => clearCache(["month", "tasks", "users", "template", "categories"]),
  });
  const generateNewAvatarMutation = useMutation(generateNewAvatarOptions);

  // Helper functions ----------------------------------------------

  const updateUserTask = async(updates: Omit<User, "passwordHash"> & { password?: string }) => {
    await updateUserMutation.mutateAsync(updates);
    toast.success("User updated!");
  }
  
  const uploadAvatarTask = async (userId: string, file: File) => {
    if (monthQuery.isError || monthQuery.isLoading) return;

    // Convert File to Base64 string
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const base64String = reader.result as string; // This is your Base64 string
      await uploadAvatarMutation.mutateAsync({ userId, file: base64String });
      toast.success("Avatar updated!");
    };
    reader.onerror = (error) => {
      console.error("Error reading file:", error);
      toast.error("Failed to update avatar");
    };
    toast.success("Progress updated!");
  };

  const generateAvatarTask = async (userId: string) => {
    if (monthQuery.isError || monthQuery.isLoading) return;
    const newUser = await generateNewAvatarMutation.mutateAsync({ userId });
    toast.success("Progress updated!");
    return newUser;
  };

  const completeTask = async (taskId: string) => {
    if (monthQuery.isError || monthQuery.isLoading) return;
    await completeTaskMutation.mutateAsync({ taskId });
    toast.success("Progress updated!");
  };

  const addTask = async (
    task: Omit<Task, "id" | "createdAt" | "templateTaskId">,
    userIds: string[],
    categoryId: string,
  ) => {
    await addTaskMutation.mutateAsync({
      task: { ...task, categoryId, userIds: userIds, templateTaskId: null },
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
    updates: Omit<Task, "id">,
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
  const deleteTemplateTask = async (templateTaskId: string) => {
    await deleteTemplateTaskMutation.mutateAsync({ templateTaskId });
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
        deleteTemplateTask,
        addTemplateCategory,
        updateCategory,
        deleteCategory,
        updateUserTask,
        generateAvatarTask,
        uploadAvatarTask,
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
    task: Omit<Task, "id" | "createdAt" | "templateTaskId">,
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
    updates: Omit<Task, "id">,
    categoryId: string,
    userIds: string[]
  ) => void;
  updateTemplateTask: (
    templateTaskId: string,
    updates: Omit<TemplateTask, "id">,
    templateCategoryId: string,
    userIds: string[]
  ) => void;
  deleteTask: (taskId: string) => void;
  deleteTemplateTask: (templateTask: string) => void;
  addTemplateCategory: (category: Omit<Category, "id" | "tasks">) => void;
  updateCategory: (
    categoryId: string,
    updates: Omit<Category, "tasks">
  ) => void;
  deleteCategory: (categoryId: string) => void;
  updateUserTask: (userId: Omit<User, "passwordHash"> & { password?: string }) => void;
  generateAvatarTask: (userId: string) => Promise<User | undefined>;
  uploadAvatarTask: (userId: string, file: File) => void;
};

export const useTask = () => {
  const context = useContext(TaskContext);
  if (context === undefined) {
    throw new Error("useTask must be used within a TaskProvider");
  }
  return context;
};
