import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { type UserShape } from "../../server/index.ts";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTask } from "@/contexts/TaskContext";

interface UserAvatarProps {
  user: UserShape;
  updatedAvatar?: string;
  dimmed?: boolean; // Add a prop to control dimming
  size?: "sm" | "md" | "lg";
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  user,
  dimmed,
  updatedAvatar,
}) => {
  const { users } = useTask();
  if (
    users == null ||
    users[user.id] == null ||
    (users[user.id].avatar == null && updatedAvatar == null)
  )
    return null;
  const avatar = updatedAvatar
    ? updatedAvatar
    : users
    ? users[user.id].avatar
    : null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Avatar className={cn(dimmed && "avatar-dimmed")}>
            {avatar ? (
              <AvatarImage src={avatar} alt={user.email} />
            ) : (
              <AvatarFallback>
                {user.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            )}
          </Avatar>
        </TooltipTrigger>
        <TooltipContent>
          <p>{user.name}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
