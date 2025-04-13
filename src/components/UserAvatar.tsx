// src/components/UserAvatar.tsx
import React, { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface UserAvatarProps {
  email: string;
  avatarData: string | null;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({ email, avatarData }) => {

  return (
    <Avatar>
      {avatarData ? (
        <AvatarImage src={avatarData} alt={email} />
      ) : (
        <AvatarFallback>{email.charAt(0).toUpperCase()}</AvatarFallback>
      )}
    </Avatar>
  );
};
