import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { trpc } from "../api";
import type { Value } from "../../server/db";

export default function Admin() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    role: "user",
  });

  const [users, setUsers] = useState<Value<"user">[]>([]);

  useEffect(() => {
    trpc.userList.query().then((value) => setUsers(value));
    /*
    trpc.userList
      .query()
      .then((value) => console.log(JSON.stringify(value, null, 2)));
      */
  }, []);

  // Check if user is admin, if not redirect
  if (user?.role !== "admin") {
    navigate("/");
    return null;
  }

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();

    const newId = (users.length + 1).toString();

    setUsers([
      ...users,
      {
        id: newId,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role as "user" | "admin",
      },
    ]);

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
                <th className="text-left p-2">ID</th>
                <th className="text-left p-2">Name</th>
                <th className="text-left p-2">Email</th>
                <th className="text-left p-2">Role</th>
                <th className="text-left p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b">
                  <td className="p-2">{user.id}</td>
                  <td className="p-2">{user.name}</td>
                  <td className="p-2">{user.email}</td>
                  <td className="p-2">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        user.role === "admin"
                          ? "bg-primary/15 text-primary"
                          : "bg-muted text-muted-foreground"
                      }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="p-2">
                    <Button variant="ghost" size="sm" className="h-8 px-2">
                      Edit
                    </Button>
                    {user.id !== "1" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-destructive"
                        onClick={() => {
                          setUsers(users.filter((u) => u.id !== user.id));
                          toast.success("User removed successfully");
                        }}>
                        Delete
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
