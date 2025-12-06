import { type Loadable, setState, resetState, selectorFamily } from "atom.io";
import { trpcClient } from "./trpc-client-service";
import { TRPCError, inferProcedureOutput } from "@trpc/server";
import { atom, atomFamily } from "atom.io";
import { type CacheArg, type CacheKey } from "../server/events";
import type { AppRouter } from "../server/index";
import type {
  ISO18601,
} from "../server/schema";

// = TYPES ============================================================

export type ServerFocusedTaskIds = inferProcedureOutput<AppRouter["getFocusedTaskIds"]>;
export type ServerBacklogTasks = inferProcedureOutput<AppRouter["getBacklogTasks"]>;
export type ServerBacklogTask = Base<ServerBacklogTasks>;
export type ServerGetCategories = inferProcedureOutput<AppRouter["getCategories"]>;
export type ServerGetCategory = inferProcedureOutput<AppRouter["getCategory"]>;
export type ServerActiveMonth = inferProcedureOutput<AppRouter["getActiveMonth"]>;
export type ServerStatistics = inferProcedureOutput<AppRouter["getStatistics"]>
export type ServerGetTemplateTasks = inferProcedureOutput<AppRouter["getTemplateTasks"]>;
export type ServerGetUser = inferProcedureOutput<AppRouter["getUser"]>;
export type ServerGetTask = inferProcedureOutput<AppRouter["getTask"]>;
export type ServerGetTemplate = inferProcedureOutput<AppRouter["getTemplate"]>;

type Base<T extends readonly unknown[]> = T[number];

// = PLACEHOLDERS =====================================================

// TODO: use arktype to validate the output from these things

function setPlaceholderMonth(month: ServerActiveMonth) {
  localStorage.setItem('currentMonth', JSON.stringify(month))
}

export function getPlaceholderMonth() {
  const storage = localStorage.getItem('currentMonth')
  if (storage === null) return EMPTY_MONTH
  return JSON.parse(storage) as ServerActiveMonth
}

export function getCategoryIdPlaceholders() {
  const storage = localStorage.getItem('categoryIds')
  if (storage === null) return []
  return JSON.parse(storage) as string[]
}

function setCategoryIdPlaceholders(categoryIds: string[]) {
  localStorage.setItem('categoryIds', JSON.stringify(categoryIds))
}

export function getTemplateTaskIdsPlaceholders() {
  const storage = localStorage.getItem('templateTaskIds')
  if (storage === null) return []
  return JSON.parse(storage) as string[]
}

function setTemplateTaskIdsPlaceholders(templateTaskIds: string[]) {
  localStorage.setItem('templateTaskIds', JSON.stringify(templateTaskIds))
}

export function getCurrentTaskIdsPlaceholders() {
  const storage = localStorage.getItem('currentTaskIds')
  if (storage === null) return []
  return JSON.parse(storage) as string[]
}

function setCurrentTaskIdsPlaceholders(currentTaskIds: string[]) {
  localStorage.setItem('currentTaskIds', JSON.stringify(currentTaskIds))
}

export function getCurrentTaskPlaceholder(taskId: string) {
  const storage = localStorage.getItem(`currentTaskAtom-${taskId}`)
  if (storage === null) return EMPTY_TASK
  return JSON.parse(storage) as ServerGetTask
}

function setCurrentTaskPlaceholder(taskId: string, task: ServerGetTask) {
  localStorage.setItem(`currentTaskAtom-${taskId}`, JSON.stringify(task))
}

export function getCategoryPlaceholder(categoryId: string) {
  const storage = localStorage.getItem(`categoryAtom-${categoryId}`)
  if (storage === null) return EMPTY_CATEGORY
  return JSON.parse(storage) as ServerGetCategory
}

function setCategoryPlaceholder(categoryId: string, category: ServerGetCategory) {
  localStorage.setItem(`categoryAtom-${categoryId}`, JSON.stringify(category))
}

// = CONSTANTS ========================================================


export const EMPTY_MONTH: ServerActiveMonth = {
  id: "",
  name: "",
  startDate: "start_date" as ISO18601,
  endDate: "-",
  newMoonDate: "-",
  fullMoonDate: "-",
  isActive: 0,
};

export const EMPTY_STATISTICS: ServerStatistics = {
  overall: [],
  categoryData: [],
}

export const EMPTY_TASK: ServerGetTask = {
  id: '',
  description: '',
  title: '',
  storyPoints: 0,
  targetCount: 1,
  categoryId: '',
  templateTaskId: null,
  isFocused: 0,
  monthId: '',
  completedCount: 0,
  taskUsers: [],
}

export const EMPTY_CATEGORY: ServerGetCategory = {
  id: '',
  emoji: '',
  name: '',
  description: '',
}

export const EMPTY_USER: ServerGetUser = {
  id: '',
  email: '',
  role: 'user',
  name: '',
  avatar: null,
}

export const EMPTY_TEMPLATE: ServerGetTemplate = {
  id: '',
  isActive: 1,
}

// = ATOMS ============================================================

// - USERS ------------------------------------------------------------

export const userIdsAtom = atom<Loadable<string[]>, Error>({
  key: `userIds`,
  default: async () => {
    const users = await trpcClient.getUsers.query();
    users.forEach((user) => 
      setState(userAtoms, user.id, user)
    );
    const userIds = users.map((user) => user.id)
    return userIds;
  },
});

export const userAtoms = atomFamily<
  Loadable<ServerGetUser>,
  string,
  Error
>({
  key: `users`,
  default: async (userId) => {
    const user = await trpcClient.getUser.query({ userId })
    if (user === undefined) {
      throw new TRPCError({ code: "NOT_FOUND", message: "user not found" })
    }
    return user
  },
});

// - TASKS ------------------------------------------------------------

export const currentTaskIdsAtom = atom<Loadable<string[]>, Error>({
  key: `currentTaskIds`,
  default: async () => {
    const tasks = await trpcClient.getCurrentMonthTasks.query();
    tasks.forEach((task) => setState(currentTasksAtom, task.id, task));
    const currentTaskIds = tasks.map((task) => task.id);
    setCurrentTaskIdsPlaceholders(currentTaskIds)
    return currentTaskIds;
  },
});

export const currentTasksAtom = atomFamily<Loadable<ServerGetTask>, string, Error>({
  key: `currentTasks`,
  default: async (taskId) => {
    const task = await trpcClient.getTask.query({ taskId });
    if (!task) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Task not found" });
    }
    setCurrentTaskPlaceholder(taskId, task)
    return task;
  },
});

export const currentTasksByCategoryIdAtom = selectorFamily<
  Loadable<ServerGetTask[]>,
  string,
  Error
>({
  key: `currentTasksByCategoryId`,
  get: (categoryId) =>
    async ({ get }) => {
      const currentTaskIds = await get(currentTaskIdsAtom);
      if (currentTaskIds instanceof Error) {
        throw new TRPCError({ code: "NOT_FOUND", message: "no tasks found" });
      }
      let output: ServerGetTask[] = [];
      for (const currentTaskId of currentTaskIds) {
        const currentTask = await get(currentTasksAtom, currentTaskId);
        if (currentTask instanceof Error) {
          continue;
        }
        if (currentTask?.categoryId === categoryId) {
          output = [...output, currentTask];
        }
      }
      return output;
    },
});

export const focusedTaskIdsAtom = atom<Loadable<ServerFocusedTaskIds>, Error>({
  key: `focusedTaskIds`,
  default: async () => {
    const taskIds = await trpcClient.getFocusedTaskIds.query();
    return taskIds;
  },
});

export const backlogTaskIdsAtom = atom<Loadable<string[]>, Error>({
  key: `backlogTaskIds`,
  default: async () => {
    const backlogTasks = await trpcClient.getBacklogTasks.query();
    for (const backlogTask of backlogTasks) {
      setState(backlogTasksAtom, backlogTask.id, backlogTask);
    }
    const backlogTaskIds = backlogTasks.map((backlogTask) => backlogTask.id);
    return backlogTaskIds;
  },
});

export const backlogTasksAtom = atomFamily<
  Loadable<ServerBacklogTask>,
  string,
  Error
>({
  key: `backlogTasks`,
  default: async (backlogTaskId) => {
    const backlogTask = await trpcClient.getTask.query({
      taskId: backlogTaskId,
    });
    if (!backlogTask) {
      throw new TRPCError({ code: "NOT_FOUND", message: "backlogTask not found" });
    }
    return backlogTask;
  },
});

export const backlogTasksByCategoryIdAtom = selectorFamily<
  Loadable<ServerBacklogTask[]>,
  string,
  Error
>({
  key: `backlogTasksByCategoryId`,
  get: (categoryId) =>
    async ({ get }) => {
      const backlogTaskIds = await get(backlogTaskIdsAtom);
      if (backlogTaskIds instanceof Error) {
        throw new TRPCError({ code: "NOT_FOUND", message: "no tasks found" });
      }
      let output: ServerBacklogTasks = [];
      for (const backlogTaskId of backlogTaskIds) {
        const backlogTask = await get(backlogTasksAtom, backlogTaskId);
        if (backlogTask instanceof Error) {
          continue;
        }
        if (backlogTask.categoryId === categoryId) {
          output = [...output, backlogTask];
        }
      }
      return output;
    },
});

// - CATEGORIES -------------------------------------------------------

export const categoryIdsAtom = atom<Loadable<string[]>, Error>({
  key: `categoryIds`,
  default: async () => {
    const categories = await trpcClient.getCategories.query();
    categories.forEach((category) =>
      setState(categoriesAtom, category.id, category)
    );
    const categoryIds = categories.map((category) => category.id);
    setCategoryIdPlaceholders(categoryIds)
    return categoryIds;
  },
});

// FIXME
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
      setCategoryPlaceholder(categoryId, category);
      return category;
    },
  })

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

// - TEMPLATES AND TEMPLATE TASKS -------------------------------------

export const templateAtom = atom<Loadable<ServerGetTemplate>, Error>({
  key: `template`,
  default: async () => {
    const template = await trpcClient.getTemplate.query();
    return template;
  },
});

export const templateTaskIdsAtom = atom<Loadable<string[]>, Error>({
  key: `templateTaskIds`,
  default: async () => {
    const templateTasks = await trpcClient.getTemplateTasks.query();
    for (const templateTask of templateTasks) {
      setState(templateTasksAtom, templateTask.id, templateTask);
    }
    const templateTaskIds = templateTasks.map((category) => category.id);
    setTemplateTaskIdsPlaceholders(templateTaskIds);
    return templateTaskIds;
  },
  catch: [],
});

export const templateTasksAtom = atomFamily<
  Loadable<Base<ServerGetTemplateTasks>>,
  string,
  Error
>({
  key: `templateTasks`,
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
        const templateTask = await get(templateTasksAtom, templateTaskId);
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

// - CURRENT MONTH ----------------------------------------------------

export const currentMonthAtom = atom<Loadable<ServerActiveMonth>, Error>({
  key: `currentMonth`,
  default: async () => {
    const data = await trpcClient.getActiveMonth.query();
    setPlaceholderMonth(data)
    return data;
  },
});

// -- STATISTICS ------------------------------------------------------

export const statisticsAtom = atom<Loadable<ServerStatistics>, Error>({
  key: `statistics`,
  default: async () => {
    const output = await trpcClient.getStatistics.query()
    return output
  },
})

type StatusPageCategoryStatus = {
  totalTasks: number,
  completedTasks: number,
  completion: number,
  behindScheduleTasks: never[]
}

// TODO: IN PROGRESS
const categoryStatusSelector = selectorFamily<Loadable<StatusPageCategoryStatus>, string>({
  key: 'categoryStatusSelector',
  get: (categoryId) => async ({ get }) => {
    const category = await get(categoriesAtom, categoryId)
    const currentTaskIds = await get (currentTaskIdsAtom)
    if (!category || currentTaskIds instanceof Error)
      throw new Error("no stuff")

    const totalTasks = currentTaskIds.length;

    if (totalTasks === 0) {
      throw new Error("no stuff")
    }

    const completedTasks = 0;
    const recurringTasks = []; // TODO
    const behindScheduleTasks = []; // TODO

    // Check if any recurring tasks are behind schedule
    /*
    const behindScheduleTasks = recurringTasks.filter((task) => {
      // If we have more than 0 days remaining
      if (task.daysRemaining <= 0) return false;

      const remainingCount = task.targetCount - task.completedCount;
      const remainingCount = 1;
      const daysPerRemaining = daysRemaining / remainingCount;

      // If we need to do more than one every other day, we're behind
      return daysPerRemaining < 2;
    });
    */

    const status = {
      totalTasks,
      completedTasks,
      completion: Math.round((completedTasks / totalTasks) * 100),
      behindScheduleTasks,
    };

    return status;
  },
});

// = CACHE MANAGEMENT =================================================

export function clearCache(keys: CacheArg) {
  for (const [key, arg] of Object.entries(keys)) {
    const cacheKey = key as CacheKey;
    switch (cacheKey) {
      case "userAtoms":
        resetState(userAtoms, arg);
        break;
      case "currentTaskAtom":
        resetState(currentTasksAtom, arg);
        break;
      case "backlogTasksAtom":
        resetState(backlogTasksAtom, arg);
        break;
      case "categoryAtoms":
        resetState(categoriesAtom, arg);
        break;
      case "templateTasksAtom":
        resetState(templateTasksAtom, arg);
        break;
      case "focusedTaskIds":
        resetState(focusedTaskIdsAtom);
        break;
      case "userById":
        resetState(userIdsAtom);
        break;
      case "currentTaskIds":
        resetState(currentTaskIdsAtom);
        break;
      case "backlogTaskIds":
        resetState(backlogTaskIdsAtom);
        break;
      case "categoryIds":
        resetState(categoryIdsAtom);
        break;
      case "templateTaskIds":
        resetState(templateTaskIdsAtom);
        break;
      case "currentMonth":
        resetState(currentMonthAtom);
        break;
      case "template":
        resetState(templateAtom);
        break;
      case "statistics":
        resetState(statisticsAtom);
        break;
      default:
        console.error(`Unknown cache key: ${key}`);
        break;
    }
  }
}
