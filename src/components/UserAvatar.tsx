import React from "react";
import { useLoadable } from "atom.io/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { userAtoms, FAKE_USER} from "@/atoms";

interface UserAvatarProps {
  userId: string;
  updatedAvatar?: string;
  dimmed?: boolean; // Add a prop to control dimming
  size?: "sm" | "md" | "lg";
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  userId,
  dimmed,
  updatedAvatar,
}) => {
  const user = useLoadable(userAtoms, userId, FAKE_USER);
  if (user.error) return null;

  const avatar = updatedAvatar
    ? updatedAvatar
    : user.value.avatar

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Avatar className={cn(dimmed && "avatar-dimmed")}>
            {avatar ? (
              <AvatarImage src={avatar} alt={user.value.email} />
            ) : (
              <AvatarFallback>
                {user.value.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            )}
          </Avatar>
        </TooltipTrigger>
        <TooltipContent>
          <p>{user.value.name}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
