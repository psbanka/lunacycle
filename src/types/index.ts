
// User related types
export type User = {
  id: string;
  name: string;
  role: 'user' | 'admin';
};

// Task related types
export type TaskStatus = 'pending' | 'completed';

export type Task = {
  id: string;
  title: string;
  categoryId: string;
  description?: string;
  storyPoints: number;
  targetCount: number; // How many times to complete this month
  currentCount: number; // How many times completed so far
  assignedTo: string[]; // Array of user IDs
  status: TaskStatus;
  isRecurring: boolean; // Is this a recurring task from the template?
  createdAt: string;
};

// Category types
export type Category = {
  id: string;
  name: string;
  description?: string;
  tasks: Task[];
};

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

// Template related types
export type TemplateCategory = {
  id: string;
  name: string;
  description?: string;
  tasks: TemplateTask[];
};

export type TemplateTask = {
  id: string;
  title: string;
  description?: string;
  storyPoints: number;
  targetCount: number;
  assignedTo: string[];
};

export type Template = {
  id: string;
  categories: TemplateCategory[];
};
