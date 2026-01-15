import { useLoadable } from "atom.io/react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { arktypeResolver } from "@hookform/resolvers/arktype";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { type } from "arktype";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { LoadingScreen } from "@/components/LoadingScreen";
import { EditUserDialog } from "@/components/EditUserDialog";
import { User } from "../../server/schema";
import { userIdsAtom } from "@/atoms.ts";
import { UserRow } from "@/components/UserRow";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { addUser, deleteUser } from "@/actions";

// Schema for user creation
export const UserSchema = type({
  name: "string > 0",
  email: "string > 0",
  password: "string > 0",
  role: "string > 0",
});

type UserFormValues = typeof UserSchema.infer;

export default function Admin() {
  const userIds = useLoadable(userIdsAtom, []);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const form = useForm<UserFormValues>({
    resolver: arktypeResolver(UserSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: "user",
    },
  });

  const errorMessages = Object.values(form.formState.errors).map(
    (error) => error.message
  );

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

  const handleDeleteUser = async (userId: string) => {
    await deleteUser(userId);
  };

  const handleUserUpdated = (updatedUser: User) => {
    // Logic to update the user in the database
    // You might need to refetch the user data here
    console.log("User updated:", updatedUser);
  };

  const handleAddUser = (values: UserFormValues) => {
    addUser(values);
    form.reset();
    toast.success("User added successfully!");
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

      {/* Add User Form */}
      <div className="glass-card p-6 rounded-lg mb-8">
        <h2 className="text-xl font-semibold mb-4">Add New User</h2>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleAddUser)}>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="user@example.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <FormControl>
                      <select
                        {...field}
                        className="w-full p-2 rounded-md border border-input h-10">
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Button type="submit" className="w-full">
              Add User
            </Button>
          </form>
        </Form>
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
                <UserRow
                  key={id}
                  userId={id}
                  handleEditUser={handleEditUser}
                  handleDeleteUser={handleDeleteUser}
                />
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
