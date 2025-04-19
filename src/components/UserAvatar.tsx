import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { type User } from "../../server/schema"
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  user: User;
  dimmed?: boolean; // Add a prop to control dimming
  size?: "sm" | "md" | "lg";
}

export const UserAvatar: React.FC<UserAvatarProps> = ({ user, dimmed }) => {
  return (
    <Avatar className={cn(dimmed && "avatar-dimmed")}> {/* Apply dimmed class conditionally */}
      {user.avatar ? (
        <AvatarImage src={user.avatar} alt={user.email} />
      ) : (
        <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
      )}
    </Avatar>
  );
};
