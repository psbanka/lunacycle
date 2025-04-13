import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  email: string;
  avatarData: string | null;
  dimmed?: boolean; // Add a prop to control dimming
  size?: "sm" | "md" | "lg";
}

export const UserAvatar: React.FC<UserAvatarProps> = ({ email, avatarData, dimmed }) => {
  return (
    <Avatar className={cn(dimmed && "avatar-dimmed")}> {/* Apply dimmed class conditionally */}
      {avatarData ? (
        <AvatarImage src={avatarData} alt={email} />
      ) : (
        <AvatarFallback>{email.charAt(0).toUpperCase()}</AvatarFallback>
      )}
    </Avatar>
  );
};
