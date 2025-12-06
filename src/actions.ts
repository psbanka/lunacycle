import { trpcClient } from "./trpc-client-service";
import type { AppRouter } from "../server/index";
import { inferProcedureInput } from "@trpc/server";
import { toast } from "sonner";

export type ServerUpdateUser = inferProcedureInput<AppRouter["updateUser"]>;
export const updateUserTask = async(updates: ServerUpdateUser) => {
  await trpcClient.updateUser.mutate(updates);
  toast.success("User updated!");
}
  
export const uploadAvatarTask = async (userId: string, file: File) => {
  // Convert File to Base64 string
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = async () => {
    const base64String = reader.result as string; // This is your Base64 string
    await trpcClient.uploadAvatar.mutate({ userId, file: base64String });
    toast.success("Avatar updated!");
  };
  reader.onerror = (error) => {
    console.error("Error reading file:", error);
    toast.error("Failed to update avatar");
  };
  toast.success("Progress updated!");
};

export const generateAvatarTask = async () => {
  // const newAvatar = await generateNewAvatarQuery.data
  return "foo";
};

export const startCycle = async (props: inferProcedureInput<AppRouter["startCycle"]>) => {
  await trpcClient.startCycle.mutate(props);
  toast.success("✨ New cycle created!");
};

export const completeTask = async (taskId: string) => {
  await trpcClient.completeTask.mutate({ taskId });
  toast.success("Progress updated!");
};

export type AddTaskProps = inferProcedureInput<AppRouter["addTask"]>
export const addTask = async (props: AddTaskProps) => {
  await trpcClient.addTask.mutate({
    task: { ...props.task, templateTaskId: null },
  });
};

export type AddTemplateTaskProps = inferProcedureInput<AppRouter["addTemplateTask"]>
export const addTemplateTask = async (props: AddTemplateTaskProps) => {
  await trpcClient.addTemplateTask.mutate({
    task: { ...props.task },
  });
  toast.success("Template Task added successfully!");
};

export type UpdateTaskProps = inferProcedureInput<AppRouter["updateTask"]>
export const updateTask = async (props: UpdateTaskProps) => {
  await trpcClient.updateTask.mutate(props)
  toast.success("Task updated!");
};

export type UpdateTemplateTaskProps = inferProcedureInput<AppRouter["updateTemplateTask"]>
export const updateTemplateTask = async (props: UpdateTemplateTaskProps) => {
  await trpcClient.updateTemplateTask.mutate(props)
  toast.success("Template task updated!");
};

export type deleteTaskProps = inferProcedureInput<AppRouter["deleteTask"]>
export const deleteTask = async (taskId: string) => {
  await trpcClient.deleteTask.mutate({ taskId });
  toast.success("Task deleted!");
};

export type deleteTemplateTaskProps = inferProcedureInput<AppRouter["deleteTemplateTask"]>
export const deleteTemplateTask = async (templateTaskId: string) => {
  await trpcClient.deleteTemplateTask.mutate({ templateTaskId });
  toast.success("Task deleted!");
};

export type addCategoryProps = inferProcedureInput<AppRouter["addCategory"]>
export const addCategory = async (props: addCategoryProps) => {
  await trpcClient.addCategory.mutate({ category: props.category });
  toast.success("Category added!");
};

export type updateCategoryProps = inferProcedureInput<AppRouter["updateCategory"]>
export const updateCategory = async (props: updateCategoryProps) => {
  await trpcClient.updateCategory.mutate({
    name: props.name,
    description: props.description,
    emoji: props.emoji,
    id: props.id,
  });
  toast.success("Category updated!");
};

export type deleteCategoryProps = inferProcedureInput<AppRouter["deleteCategory"]>
const deleteCategory = async (categoryId: string) => {
  await trpcClient.deleteCategory.mutate({ id: categoryId });
  toast.success("Category deleted!");
};

export const sendMessage = async (props: inferProcedureInput<AppRouter["sendMessage"]>) => {
  await trpcClient.sendMessage.mutate(props);
};

