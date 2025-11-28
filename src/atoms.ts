import { type Loadable, setState, selector, selectorFamily } from "atom.io";
import { trpcClient } from "./trpc-client-service";
import { TRPCError, inferProcedureOutput } from "@trpc/server";
import { atom, atomFamily } from "atom.io";
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

export const FAKE_CATEGORY: ServerGetCategory = {
  id: '',
  emoji: '',
  name: '',
  description: '',
}

export const FAKE_USER: ServerGetUser = {
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
  key: `userById`,
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
  key: `taskIds`,
  default: async () => {
    const tasks = await trpcClient.getCurrentMonthTasks.query();
    tasks.forEach((task) => setState(currentTasksAtom, task.id, task));
    return tasks.map((task) => task.id);
  },
});

export const currentTasksAtom = atomFamily<Loadable<ServerGetTask>, string, Error>({
  key: `tasks`,
  default: async (taskId) => {
    const task = await trpcClient.getTask.query({ taskId });
    if (!task) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Task not found" });
    }
    return task;
  },
});

export const currentTasksByCategoryIdAtom = selectorFamily<
  Loadable<ServerGetTask[]>,
  string,
  Error
>({
  key: `currentTasksByCategory`,
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
      setState(backlogTaskAtoms, backlogTask.id, backlogTask);
    }
    const backlogTaskIds = backlogTasks.map((backlogTask) => backlogTask.id);
    return backlogTaskIds;
  },
});

export const backlogTaskAtoms = atomFamily<
  Loadable<ServerBacklogTask>,
  string,
  Error
>({
  key: `backlogTask`,
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
  key: `backlogTasksByCategory`,
  get: (categoryId) =>
    async ({ get }) => {
      const backlogTaskIds = await get(backlogTaskIdsAtom);
      if (backlogTaskIds instanceof Error) {
        throw new TRPCError({ code: "NOT_FOUND", message: "no tasks found" });
      }
      let output: ServerBacklogTasks = [];
      for (const backlogTaskId of backlogTaskIds) {
        const backlogTask = await get(backlogTaskAtoms, backlogTaskId);
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
      setState(categoryAtoms, category.id, category)
    );
    const categoryIds = categories.map((category) => category.id);
    return categoryIds;
  },
});

// FIXME
// TODO::REname to categoryByIdSelector
export const categoryByIdAtom = selectorFamily<Loadable<Base<ServerGetCategories>>, string, Error>({
  key: `categoryById`,
  get: (categoryId) => async ({ get }) => {
      const category = await get(categoryAtoms, categoryId);
      if (category instanceof Error) {
        throw new TRPCError({ code: "NOT_FOUND", message: "No categories found" });
      }
      if (category === undefined)
        throw new TRPCError({ code: "NOT_FOUND", message: "No categories found" });
      return category;
    },
  })

export const categoryAtoms = atomFamily<Loadable<ServerGetCategory>, string, Error>({
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

// - CURRENT MONTH ----------------------------------------------------

export const currentMonthAtom = atom<Loadable<ServerActiveMonth>, Error>({
  key: `currentMonth`,
  default: async () => {
    const data = trpcClient.getActiveMonth.query();
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
    const category = await get(categoryAtoms, categoryId)
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
