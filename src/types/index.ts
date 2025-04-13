import { FIBONACCI } from "../../shared/types";

// User related types
export type User = {
  id: string;
  name: string;
  role: 'user' | 'admin' | 'family';
};

/*
export type Task = {
  id: string;
  title: string;
  description: string | null;
  storyPoints: typeof FIBONACCI[number];
  targetCount: number; // How many times to complete this month
  completedCount: number; // How many times completed so far
  assignedTo: User[]; // Array of users
};
*/

// Category types
/*
export type Category = {
  id: string;
  name: string;
  description: string | null;
  tasks: Task[];
};
*/

/*
// Month related types
export type MonthData = {
  id: string;
  name: string; // e.g., "October 2023"
  startDate: string;
  endDate: string;
  newMoonDate: string;
  fullMoonDate: string;
  categories: Category[];
  isActive: boolean;
};
*/

// Template related types
export type TemplateCategory = {
  id: string;
  name: string;
  description: string | null;
  templateTasks: TemplateTask[];
};

export type TemplateTask = {
  id: string;
  title: string;
  description: string | null;
  storyPoints: typeof FIBONACCI[number];
  targetCount: number;
  assignedTo: User[];
};

export type Template = {
  id: string;
  templateCategories: TemplateCategory[];
};
