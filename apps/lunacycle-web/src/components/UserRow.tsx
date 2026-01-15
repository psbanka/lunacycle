import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/UserAvatar";
import { useLoadable } from "atom.io/react"
import { userAtoms, EMPTY_USER } from "@/atoms"
import { toast } from "sonner";

type Props = {
  userId: string;
  handleEditUser: (userId: string) => void;
  handleDeleteUser: (userId: string) => void;
};

export function UserRow({ userId, handleEditUser, handleDeleteUser }: Props) {
  const user = useLoadable(userAtoms, userId, EMPTY_USER)
  if (user.error) return null

  return (
    <tr key={userId} className="border-b">
      <td className="text-left p-2">{user.value.name}</td>
      <td className="text-left p-2">{user.value.email}</td>
      <td className="text-left p-2">
        <span
          className={`px-2 py-1 rounded-full text-xs ${
            user.value.role === "admin"
              ? "bg-primary/15 text-primary"
              : "bg-muted text-muted-foreground"
          }`}
        >
          {user.value.role}
        </span>
      </td>
      <td className="p-2">
        <UserAvatar userId={userId}/>
      </td>
      <td className="p-2">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2"
          onClick={() => handleEditUser(userId)}
        >
          Edit
        </Button>
        {userId !== "1" && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-destructive"
            onClick={() => handleDeleteUser(userId)}
          >
            Delete
          </Button>
        )}
      </td>
    </tr>
  );
}