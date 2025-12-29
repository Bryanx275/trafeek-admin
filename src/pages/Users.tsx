import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Ban, CheckCircle, Trash2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface User {
  _id: string;
  email: string;
  name?: string;
  role: string;
  isSuspended: boolean;
  suspensionReason?: string;
  createdAt: string;
}

export default function Users() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const queryClient = useQueryClient();

  const { data: usersData, isLoading } = useQuery({
    queryKey: ["users", search, roleFilter],
    queryFn: async () => {
      const params: any = {};
      if (search) params.search = search;
      if (roleFilter !== "all") params.role = roleFilter;
      
      const res = await api.get("/admin/users", { params });
      return res.data;
    },
  });

  const suspendMutation = useMutation({
    mutationFn: async ({ userId, reason }: { userId: string; reason: string }) => {
      await api.post(`/admin/users/${userId}/suspend`, { reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("User suspended successfully");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to suspend user");
    },
  });

  const unsuspendMutation = useMutation({
    mutationFn: async (userId: string) => {
      await api.post(`/admin/users/${userId}/unsuspend`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("User unsuspended successfully");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to unsuspend user");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (userId: string) => {
      await api.delete(`/admin/users/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("User deleted successfully");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete user");
    },
  });

  const handleSuspend = (userId: string, email: string) => {
    const reason = prompt(`Suspend ${email}?\n\nEnter reason:`);
    if (reason) {
      suspendMutation.mutate({ userId, reason });
    }
  };

  const handleUnsuspend = (userId: string) => {
    if (confirm("Are you sure you want to unsuspend this user?")) {
      unsuspendMutation.mutate(userId);
    }
  };

  const handleDelete = (userId: string, email: string) => {
    const confirm = prompt(
      `⚠️ DELETE USER: ${email}\n\nThis will permanently delete the user and all their data (reports, subscriptions, payments).\n\nType "DELETE" to confirm:`
    );
    if (confirm === "DELETE") {
      deleteMutation.mutate(userId);
    }
  };

  const users = usersData?.users || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Users Management</h1>
        <p className="text-muted-foreground">
          Manage user accounts and permissions
        </p>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by email or name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2 border rounded-md bg-background"
          >
            <option value="all">All Roles</option>
            <option value="free">Free</option>
            <option value="premium">Premium</option>
            <option value="admin">Admin</option>
          </select>
        </div>
      </Card>

      {/* Users Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              users.map((user: User) => (
                <TableRow key={user._id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{user.name || "—"}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={user.role === "premium" ? "default" : "secondary"}
                    >
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {user.isSuspended ? (
                      <div className="flex items-center gap-2">
                        <Badge variant="destructive" className="gap-1">
                          <Ban className="h-3 w-3" />
                          Suspended
                        </Badge>
                        {user.suspensionReason && (
                          <span className="text-xs text-muted-foreground" title={user.suspensionReason}>
                            (Reason)
                          </span>
                        )}
                      </div>
                    ) : (
                      <Badge variant="outline" className="gap-1">
                        <CheckCircle className="h-3 w-3 text-green-600" />
                        Active
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">
                      {formatDistanceToNow(new Date(user.createdAt), {
                        addSuffix: true,
                      })}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {user.role !== "admin" && (
                        <>
                          {user.isSuspended ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUnsuspend(user._id)}
                              disabled={unsuspendMutation.isPending}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleSuspend(user._id, user.email)}
                              disabled={suspendMutation.isPending}
                            >
                              <Ban className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(user._id, user.email)}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Warning */}
      <Card className="p-4 bg-amber-50 border-amber-200">
        <div className="flex gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-amber-900">Careful with user actions</p>
            <p className="text-sm text-amber-700 mt-1">
              Deleting a user permanently removes all their data including reports,
              subscriptions, and payment history. This action cannot be undone.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
