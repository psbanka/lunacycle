import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User } from "../../server/schema";
import { useState, useEffect } from "react";
import { UserAvatar } from "@/components/UserAvatar";
import { useTask } from "@/contexts/TaskContext";
import { toast } from "sonner";

interface EditUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User;
  onUserUpdated: (user: User) => void;
}

export const EditUserDialog: React.FC<EditUserDialogProps> = ({
  open,
  onOpenChange,
  user,
  onUserUpdated,
}) => {
  const [editedUser, setEditedUser] = useState<User>({ ...user });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { generateAvatarTask, uploadAvatarTask, updateUserTask } = useTask();

  // Update the editedUser state when the user prop changes
  useEffect(() => {
    setEditedUser({ ...user });
  }, [user]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setSelectedFile(file);
  };

  const handleGenerateNewAvatar = async () => {
    await generateAvatarTask(editedUser.id);
    toast.success("New avatar generated!");
  };

  const handleUpdateAvatar = async () => {
    if (!selectedFile) {
      toast.error("No file selected");
      return;
    }
    try {
      await uploadAvatarTask(editedUser.id, selectedFile);
      toast.success("Avatar updated successfully!");
    } catch (error) {
      console.error("Error uploading avatar:", error);
      toast.error("Failed to update avatar");
    }
  };

  const handleSave = async () => {
    try {
      // Optimistically update the UI
      onUserUpdated(editedUser);
      await updateUserTask(editedUser);
      toast.success("User updated successfully!");
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating user:", error);
      toast.error("Failed to update user");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>
            Make changes to the user's details here.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={editedUser.name}
              onChange={(e) =>
                setEditedUser({ ...editedUser, name: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={editedUser.email}
              onChange={(e) =>
                setEditedUser({ ...editedUser, email: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Leave blank to keep current password"
              onChange={(e) =>
                setEditedUser({ ...editedUser, passwordHash: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <select
              id="role"
              value={editedUser.role}
              onChange={(e) =>
                setEditedUser({ ...editedUser, role: e.target.value })
              }
              className="w-full p-2 rounded-md border border-input"
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label>Avatar</Label>
            <UserAvatar
              email={editedUser.email}
              avatarData={editedUser.avatar}
              size="lg"
            />
            <div className="flex gap-2 mt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerateNewAvatar}
              >
                Generate New Avatar
              </Button>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                id="avatar-upload"
                className="hidden"
              />
              <Label
                htmlFor="avatar-upload"
                className="cursor-pointer bg-muted rounded-md px-2 py-1 text-sm"
              >
                Upload New Avatar
              </Label>
              {selectedFile && (
                <Button variant="outline" size="sm" onClick={handleUpdateAvatar}>
                  Update Avatar
                </Button>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="secondary"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button type="button" onClick={handleSave}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
