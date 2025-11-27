import React from "react";
import type { Control } from "react-hook-form";
import type { User } from "../../server/schema";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { UserAvatar } from "@/components/UserAvatar";
import { UserShape } from "../../server/index.ts";

interface UserSelectionFormItemProps {
  control: Control<any>; // Using `any` for now, can be improved with form values type
  name: string;
  label?: string;
  description?: React.ReactNode;
  users: Record<string, UserShape>;
  onSelectionChange?: (userIds: string[]) => void;
}

export function UserSelectionFormItem({
  control,
  name,
  label = "Assign to",
  description = "Select at least one person to assign this task to",
  users,
  onSelectionChange,
}: UserSelectionFormItemProps) {
  const nonAdminUsers = Object.values(users).reduce((acc, user) => {
    if (user.role !== "admin") {
      acc.push(user);
    }
    return acc;
  }, [] as UserShape[]);

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        const handleSelectionChange = (newSelection: string[]) => {
          field.onChange(newSelection);
          onSelectionChange?.(newSelection);
        };

        return (
          <FormItem>
            <FormLabel>{label}</FormLabel>
            <FormControl>
              <div className="grid grid-cols-3 gap-3">
                {nonAdminUsers
                  .map((user) => {
                    const isSelected = field.value?.includes(user.id);

                    return (
                      <Button
                        key={user.id}
                        type="button"
                        variant={isSelected ? "default" : "outline"}
                        className="flex items-center justify-start gap-2 h-auto p-2"
                        onClick={() => {
                          const selectedUserIds = field.value || [];
                          if (isSelected) {
                            // Don't allow unchecking the last user
                            if (selectedUserIds.length > 1) {
                              const newUserIds = selectedUserIds.filter(
                                (id: string) => id !== user.id
                              );
                              handleSelectionChange(newUserIds);
                            }
                          } else {
                            const newUserIds = [...selectedUserIds, user.id];
                            handleSelectionChange(newUserIds);
                          }
                        }}
                      >
                        <Avatar className="h-8 w-8">
                          <UserAvatar userId={user.id} dimmed={!isSelected} />
                        </Avatar>
                        <span className="hidden sm:inline truncate">
                          {user.name}
                        </span>
                        <span className="sm:hidden inline">
                          {user.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </span>
                      </Button>
                    );
                  })}
              </div>
            </FormControl>
            <FormDescription>{description}</FormDescription>
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}