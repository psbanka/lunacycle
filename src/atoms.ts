import { type Loadable, setState, selectorFamily } from "atom.io";
import { trpcClient } from "./trpc-client-service";
import { TRPCError, inferProcedureOutput } from "@trpc/server";
import { atom, atomFamily } from "atom.io";
import type { AppRouter } from "../server/index";
import type {
  ISO18601,
  Month,
  Task,
  TemplateTask,
  Category,
} from "../server/schema";

export const EMPTY_MONTH: Month = {
  id: "",
  name: "",
  startDate: "start_date" as ISO18601,
  endDate: "-",
  newMoonDate: "-",
  fullMoonDate: "-",
  isActive: 0,
};

export const FAKE_CATEGORY: Category = {
  id: '',
  emoji: '',
  name: '',
  description: '',
}
type Base<T extends readonly unknown[]> = T[number];

// type A = string[];
// type B = Base<A>;   // string

// type C = readonly [number, boolean];
// type D = Base<C>;   // number | boolean

// - ATOMS ---------------------------------------

export type ServerFocusedTaskIds = inferProcedureOutput<AppRouter["getFocusedTaskIds"]>;
export const focusedTaskIdsAtom = atom<Loadable<ServerFocusedTaskIds>, Error>({
  key: `focusedTaskIds`,
  default: async () => {
    const taskIds = await trpcClient.getFocusedTaskIds.query();
    return taskIds;
  },
});

export type ServerGetCategories = inferProcedureOutput<AppRouter["getCategories"]>;
export const categoryIdsAtom = atom<Loadable<string[]>, Error>({
  key: `categoryIds`,
  default: async () => {
    const categories = await trpcClient.getCategories.query();
    categories.forEach((category) =>
      setState(categoriesAtom, category.id, category)
    );
    const categoryIds = categories.map((category) => category.id);
    return categoryIds;
  },
});

// TODO::REname to categoryByIdSelector
export const categoryByIdAtom = selectorFamily<Loadable<Base<ServerGetCategories>>, string, Error>({
  key: `categoryById`,
  get: (categoryId) => async ({ get }) => {
      const category = await get(categoriesAtom, categoryId);
      if (category instanceof Error) {
        throw new TRPCError({ code: "NOT_FOUND", message: "No categories found" });
      }
      if (category === undefined)
        throw new TRPCError({ code: "NOT_FOUND", message: "No categories found" });
      return category;
    },
  })

export type ServerGetCategory = inferProcedureOutput<AppRouter["getCategory"]>;
export const categoriesAtom = atomFamily<Loadable<ServerGetCategory>, string, Error>({
  key: `categories`,
  default: async (categoryId) => {
    const category = await trpcClient.getCategory.query({ categoryId });
    if (!category) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Category not found" });
    }
    return category;
  },
});

export type ServerGetTemplateTasks = inferProcedureOutput<AppRouter["getTemplateTasks"]>;
export const templateTaskIdsAtom = atom<Loadable<string[]>, Error>({
  key: `templateTaskIds`,
  default: async () => {
    const templateTasks = await trpcClient.getTemplateTasks.query();
    for (const templateTask of templateTasks) {
      setState(templateTaskAtoms, templateTask.id, templateTask);
    }
    const templateTaskIds = templateTasks.map((category) => category.id);
    return templateTaskIds;
  },
  catch: [],
});

export const templateTaskAtoms = atomFamily<
  Loadable<Base<ServerGetTemplateTasks>>,
  string,
  Error
>({
  key: `templateTask`,
  default: async (templateTaskId) => {
    const templateTask = await trpcClient.getTemplateTask.query({
      templateTaskId,
    });
    if (!templateTask) {
      throw new TRPCError({ code: "NOT_FOUND", message: "templateTask not found" });
    }
    return templateTask;
  },
});

export const templateTasksByCategoryIdAtom = selectorFamily<
  Loadable<Base<ServerGetTemplateTasks>[]>,
  string,
  Error
>({
  key: `templateTasksByCategory`,
  get: (categoryId) =>
    async ({ get }) => {
      const templateTaskIds = await get(templateTaskIdsAtom);
      if (templateTaskIds instanceof Error) {
        throw new TRPCError({ code: "NOT_FOUND", message: "no tasks found" });
      }
      let output: ServerGetTemplateTasks = [];
      for (const templateTaskId of templateTaskIds) {
        const templateTask = await get(templateTaskAtoms, templateTaskId);
        if (templateTask instanceof Error) {
          continue;
        }
        if (templateTask.categoryId === categoryId) {
          output = [...output, templateTask];
        }
      }
      return output;
    },
});

export type ServerActiveMonth = inferProcedureOutput<AppRouter["getActiveMonth"]>;
export const currentMonthAtom = atom<Loadable<ServerActiveMonth>, Error>({
  key: `currentMonth`,
  default: async () => {
    const data = trpcClient.getActiveMonth.query();
    return data;
  },
});

export const currentTaskIdsAtom = atom<Loadable<string[]>, Error>({
  key: `taskIds`,
  default: async () => {
    const tasks = await trpcClient.getCurrentMonthTasks.query();
    tasks.forEach((task) => setState(currentTasksAtom, task.id, task));
    return tasks.map((task) => task.id);
  },
});

export type ServerTask = inferProcedureOutput<AppRouter["getTask"]>;
export const currentTasksAtom = atomFamily<Loadable<ServerTask>, string, Error>({
  key: `tasks`,
  default: async (taskId) => {
    const task = await trpcClient.getTask.query({ taskId });
    if (!task) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Task not found" });
    }
    return task;
  },
});
