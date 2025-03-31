
import React, { createContext, useState, useContext, useEffect } from 'react';
import { Category, MonthData, Task, Template, TaskStatus } from '@/types';
import { mockCurrentMonth, mockCategories, mockTemplate } from '@/data/mockData';
import { toast } from "sonner";
import { useAuth } from './AuthContext';

type TaskContextType = {
  currentMonth: MonthData;
  template: Template;
  userTasks: Task[];
  categories: Category[];
  loadingTasks: boolean;
  completeTask: (taskId: string) => void;
  incrementTaskCount: (taskId: string) => void;
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  deleteTask: (taskId: string) => void;
  addCategory: (category: Omit<Category, 'id' | 'tasks'>) => void;
  updateCategory: (categoryId: string, updates: Partial<Omit<Category, 'tasks'>>) => void;
  deleteCategory: (categoryId: string) => void;
};

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [currentMonth, setCurrentMonth] = useState<MonthData>(mockCurrentMonth);
  const [template, setTemplate] = useState<Template>(mockTemplate);
  const [categories, setCategories] = useState<Category[]>(mockCategories);
  const [loadingTasks, setLoadingTasks] = useState(true);

  // Filter tasks that are assigned to the current user
  const userTasks = user ? 
    currentMonth.categories
      .flatMap(category => category.tasks)
      .filter(task => task.assignedTo.includes(user.id)) : [];

  // Initialize data
  useEffect(() => {
    // Simulate API loading
    setLoadingTasks(true);
    setTimeout(() => {
      setLoadingTasks(false);
    }, 1000);
  }, []);

  // Complete a task
  const completeTask = (taskId: string) => {
    setCurrentMonth(prev => {
      const updatedCategories = prev.categories.map(category => {
        const updatedTasks = category.tasks.map(task => 
          task.id === taskId ? { ...task, status: 'completed' as TaskStatus } : task
        );
        
        return { ...category, tasks: updatedTasks };
      });
      
      return { ...prev, categories: updatedCategories };
    });
    
    toast.success('Task completed!');
  };

  // Increment the current count of a task
  const incrementTaskCount = (taskId: string) => {
    setCurrentMonth(prev => {
      const updatedCategories = prev.categories.map(category => {
        const updatedTasks = category.tasks.map(task => {
          if (task.id === taskId) {
            const newCount = task.currentCount + 1;
            const isComplete = newCount >= task.targetCount;
            
            return { 
              ...task, 
              currentCount: newCount,
              status: isComplete ? 'completed' as TaskStatus : 'pending' as TaskStatus
            };
          }
          return task;
        });
        
        return { ...category, tasks: updatedTasks };
      });
      
      return { ...prev, categories: updatedCategories };
    });
    
    toast.success('Progress updated!');
  };

  // Add a new task
  const addTask = (task: Omit<Task, 'id' | 'createdAt'>) => {
    const newTask: Task = {
      ...task,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    
    setCurrentMonth(prev => {
      const updatedCategories = prev.categories.map(category => {
        if (category.id === task.categoryId) {
          return {
            ...category,
            tasks: [...category.tasks, newTask]
          };
        }
        return category;
      });
      
      return { ...prev, categories: updatedCategories };
    });
    
    toast.success('Task added successfully!');
  };

  // Update a task
  const updateTask = (taskId: string, updates: Partial<Task>) => {
    setCurrentMonth(prev => {
      const updatedCategories = prev.categories.map(category => {
        const updatedTasks = category.tasks.map(task => 
          task.id === taskId ? { ...task, ...updates } : task
        );
        
        return { ...category, tasks: updatedTasks };
      });
      
      return { ...prev, categories: updatedCategories };
    });
    
    toast.success('Task updated!');
  };

  // Delete a task
  const deleteTask = (taskId: string) => {
    setCurrentMonth(prev => {
      const updatedCategories = prev.categories.map(category => ({
        ...category,
        tasks: category.tasks.filter(task => task.id !== taskId)
      }));
      
      return { ...prev, categories: updatedCategories };
    });
    
    toast.success('Task deleted!');
  };

  // Add a new category
  const addCategory = (category: Omit<Category, 'id' | 'tasks'>) => {
    const newCategory: Category = {
      ...category,
      id: crypto.randomUUID(),
      tasks: [],
    };
    
    setCurrentMonth(prev => ({
      ...prev,
      categories: [...prev.categories, newCategory]
    }));
    
    setCategories(prev => [...prev, newCategory]);
    
    toast.success('Category added!');
  };

  // Update a category
  const updateCategory = (categoryId: string, updates: Partial<Omit<Category, 'tasks'>>) => {
    setCurrentMonth(prev => {
      const updatedCategories = prev.categories.map(category => 
        category.id === categoryId ? { ...category, ...updates } : category
      );
      
      return { ...prev, categories: updatedCategories };
    });
    
    setCategories(prev => 
      prev.map(category => 
        category.id === categoryId ? { ...category, ...updates } : category
      )
    );
    
    toast.success('Category updated!');
  };

  // Delete a category
  const deleteCategory = (categoryId: string) => {
    setCurrentMonth(prev => ({
      ...prev,
      categories: prev.categories.filter(category => category.id !== categoryId)
    }));
    
    setCategories(prev => 
      prev.filter(category => category.id !== categoryId)
    );
    
    toast.success('Category deleted!');
  };

  return (
    <TaskContext.Provider
      value={{
        currentMonth,
        template,
        userTasks,
        categories,
        loadingTasks,
        completeTask,
        incrementTaskCount,
        addTask,
        updateTask,
        deleteTask,
        addCategory,
        updateCategory,
        deleteCategory,
      }}
    >
      {children}
    </TaskContext.Provider>
  );
};

export const useTask = () => {
  const context = useContext(TaskContext);
  if (context === undefined) {
    throw new Error('useTask must be used within a TaskProvider');
  }
  return context;
};
