
import { Category, MonthData, Task, Template, TemplateCategory, TemplateTask, User } from "@/types";

// Mock Users
export const mockUsers: User[] = [
  { id: '1', name: 'Admin User', role: 'admin' },
  { id: '2', name: 'Regular User', role: 'user' },
  { id: '3', name: 'Family Member', role: 'user' },
];

// Mock Tasks
export const mockTasks: Task[] = [
  {
    id: '1',
    title: 'Meditation practice',
    categoryId: '2',
    storyPoints: 3,
    targetCount: 20,
    currentCount: 5,
    assignedTo: ['1', '2'],
    status: 'pending',
    isRecurring: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    title: 'Finish book by Pema',
    categoryId: '2',
    storyPoints: 5,
    targetCount: 1,
    currentCount: 0,
    assignedTo: ['2'],
    status: 'pending',
    isRecurring: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: '3',
    title: 'Dance Class',
    categoryId: '3',
    storyPoints: 8,
    targetCount: 4,
    currentCount: 2,
    assignedTo: ['2', '3'],
    status: 'pending',
    isRecurring: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: '4',
    title: 'Make walkway',
    categoryId: '1',
    storyPoints: 13,
    targetCount: 1,
    currentCount: 0,
    assignedTo: ['1', '3'],
    status: 'pending',
    isRecurring: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: '5',
    title: 'Neighborhood Association meeting',
    categoryId: '4',
    storyPoints: 2,
    targetCount: 1,
    currentCount: 0,
    assignedTo: ['1'],
    status: 'pending',
    isRecurring: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: '6',
    title: 'NET Meeting',
    categoryId: '4',
    storyPoints: 2,
    targetCount: 1,
    currentCount: 0,
    assignedTo: ['3'],
    status: 'pending',
    isRecurring: true,
    createdAt: new Date().toISOString(),
  },
];

// Mock Categories
export const mockCategories: Category[] = [
  {
    id: '1',
    name: 'Garden',
    tasks: mockTasks.filter(task => task.categoryId === '1'),
  },
  {
    id: '2',
    name: 'Spirituality',
    tasks: mockTasks.filter(task => task.categoryId === '2'),
  },
  {
    id: '3',
    name: 'Dancing',
    tasks: mockTasks.filter(task => task.categoryId === '3'),
  },
  {
    id: '4',
    name: 'Community',
    tasks: mockTasks.filter(task => task.categoryId === '4'),
  },
];

// Mock Current Month
export const mockCurrentMonth: MonthData = {
  id: '1',
  name: 'October 2023',
  startDate: '2023-10-01',
  endDate: '2023-10-31',
  newMoonDate: '2023-10-14',
  fullMoonDate: '2023-10-28',
  categories: mockCategories,
  isActive: true,
};

// Mock Template
export const mockTemplateTask: TemplateTask[] = [
  {
    id: '1',
    title: 'Meditation practice',
    storyPoints: 3,
    targetCount: 20,
    assignedTo: ['1', '2'],
  },
  {
    id: '3',
    title: 'Dance Class',
    storyPoints: 8,
    targetCount: 4,
    assignedTo: ['2', '3'],
  },
  {
    id: '5',
    title: 'Neighborhood Association meeting',
    storyPoints: 2,
    targetCount: 1,
    assignedTo: ['1'],
  },
  {
    id: '6',
    title: 'NET Meeting',
    storyPoints: 2,
    targetCount: 1,
    assignedTo: ['3'],
  },
];

export const mockTemplateCategories: TemplateCategory[] = [
  {
    id: '1',
    name: 'Garden',
    tasks: mockTemplateTask.filter(task => task.id === '1'),
  },
  {
    id: '2',
    name: 'Spirituality',
    tasks: mockTemplateTask.filter(task => task.id === '1'),
  },
  {
    id: '3',
    name: 'Dancing',
    tasks: mockTemplateTask.filter(task => task.id === '3'),
  },
  {
    id: '4',
    name: 'Community',
    tasks: mockTemplateTask.filter(task => ['5', '6'].includes(task.id)),
  },
];

export const mockTemplate: Template = {
  id: '1',
  categories: mockTemplateCategories,
};
