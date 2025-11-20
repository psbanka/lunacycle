import { type Loadable, setState } from "atom.io"
import { trpcClient } from './trpc-client-service';
import { atom, atomFamily } from "atom.io"
import type { ISO18601, Month, User, Task, TemplateTask, Category } from "../server/schema";

export const EMPTY_MONTH: Month = {
  id: "",
  name: "",
  startDate: "start_date" as ISO18601,
  endDate: "-",
  newMoonDate: "-",
  fullMoonDate: "-",
  isActive: 0,
};

// - ATOMS ---------------------------------------

export const focusedTaskIdsAtom = atom<Loadable<string[]>, Error>({
  key: `focusedTaskIds`,
  default: async() => {
    const taskIds = await trpcClient.getFocusedTaskIds.query();
    return taskIds;
  },
});

export const categoryIdsAtom = atom<Loadable<string[]>, Error>({
  key: `categoryIds`,
  default: async() => {
    const categories = await trpcClient.getCategories.query();
    categories.forEach((category) => setState(categoriesAtom, category.id, category));
    const categoryIds = categories.map((category) => category.id);
    return categoryIds;
  },
});

export const categoriesAtom = atomFamily<Loadable<Category>, string, Error>({
  key: `categories`,
  default: async(categoryId) => {
    const category = await trpcClient.getCategory.query({ categoryId });
    if (!category) {
      throw new Error("Category not found");
    }
    return category;
  },
});

export const currentMonthAtom = atom<Loadable<Month>, Error>({
  key: `currentMonth`,
  default: async() => {
    const data = trpcClient.getActiveMonth.query();
    return data;
  },
})

export const currentTaskIdsAtom = atom<Loadable<string[]>, Error>({
  key: `taskIds`,
  default: async() => {
    const tasks = await trpcClient.getCurrentMonthTasks.query();
    tasks.forEach((task) => setState(currentTasksAtom, task.id, task));
    return tasks.map((task) => task.id);
  },
});

export const currentTasksAtom = atomFamily<Loadable<Task>, string, Error>({
  key: `tasks`,
  default: async(taskId) => {
    const task = await trpcClient.getTask.query({ taskId });
    if (!task) {
      throw new Error("Task not found");
    }
    return task;
  },
});