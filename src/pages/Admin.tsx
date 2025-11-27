import { useLoadable } from "atom.io/react";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { LoadingScreen } from "@/components/LoadingScreen";
import { EditUserDialog } from "@/components/EditUserDialog";
import { User } from "../../server/schema";
import { type UserShape } from "../../server/index.ts";
import { userIdsAtom } from "@/atoms.ts";
import { UserRow } from "@/components/UserRow";

export default function Admin() {
  const userIds = useLoadable(userIdsAtom, []);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    role: "user",
  });

  if (userIds.value.length === 0) {
    return <LoadingScreen />;
  }

  // Check if user is admin, if not redirect
  if (user?.role !== "admin") {
    navigate("/");
    return null;
  }

  const handleEditUser = (userId: string) => {
    setSelectedUserId(userId);
    setIsEditDialogOpen(true);
  };

  const handleUserUpdated = (updatedUser: User) => {
    // Logic to update the user in the database
    // You might need to refetch the user data here
    console.log("User updated:", updatedUser);
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();

    const newId = (userIds.value.length + 1).toString();

    setNewUser({
      name: "",
      email: "",
      password: "",
      role: "user",
    });

    toast.success("User added successfully!");
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

      {/* Add User Form */}
      <div className="glass-card p-6 rounded-lg mb-8">
        <h2 className="text-xl font-semibold mb-4">Add New User</h2>

        <form onSubmit={handleAddUser} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={newUser.name}
                onChange={(e) =>
                  setNewUser({ ...newUser, name: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={newUser.email}
                onChange={(e) =>
                  setNewUser({ ...newUser, email: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={newUser.password}
                onChange={(e) =>
                  setNewUser({ ...newUser, password: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <select
                id="role"
                value={newUser.role}
                onChange={(e) =>
                  setNewUser({ ...newUser, role: e.target.value })
                }
                className="w-full p-2 rounded-md border border-input"
                required>
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>

          <Button type="submit" className="w-full">
            Add User
          </Button>
        </form>
      </div>

      {/* User List */}
      <div className="glass-card p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">User Management</h2>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Name</th>
                <th className="text-left p-2">Email</th>
                <th className="text-left p-2">Role</th>
                <th className="text-left p-2">Avatar</th>
                <th className="text-left p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {userIds.value.map((id) => (
                <UserRow key={id} userId={id} handleEditUser={handleEditUser} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {selectedUserId && (
        <EditUserDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          userId={selectedUserId}
          onUserUpdated={handleUserUpdated}
        />
      )}
    </div>
  );
}
