"use client";
import { useState } from "react";
import useSWR from "swr";
import { MoreHorizontal, Search } from "lucide-react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { fetcher } from "@/lib/utils";
import type { User } from "@/lib/db/schema";
import { Badge } from "@/components/ui/badge";

export default function UserAdminPage() {
  const [userToToggle, setUserToToggle] = useState<User | null>(null);
  const [userToUpdateRole, setUserToUpdateRole] = useState<{user: User, newRole: string} | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const {
    data: userList,
    isLoading,
    mutate,
  } = useSWR<Array<User>>("/api/users", fetcher, {
    fallbackData: [],
  });

  const handleToggleActive = async () => {
    if (!userToToggle) return;

    try {
      const response = await fetch(`/api/users/${userToToggle.id}/toggle-status`, {
        method: "PATCH",
      });

      if (!response.ok) {
        throw new Error("Failed to update user status");
      }

      mutate();
      toast.success(`User ${userToToggle.isActive ? "deactivated" : "activated"} successfully!`);
    } catch (error) {
      toast.error("Failed to update user status.");
      console.error("Failed to update user status:", error);
    } finally {
      setUserToToggle(null);
    }
  };

  const handleUpdateRole = async () => {
    if (!userToUpdateRole) return;

    try {
      const response = await fetch(`/api/users/?userId=${userToUpdateRole.user.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role: userToUpdateRole.newRole }),
      });

      if (!response.ok) {
        throw new Error("Failed to update user role");
      }

      mutate();
      toast.success(`User role updated to ${userToUpdateRole.newRole} successfully!`);
    } catch (error) {
      toast.error("Failed to update user role.");
      console.error("Failed to update user role:", error);
    } finally {
      setUserToUpdateRole(null);
    }
  };

  const filteredUsers = userList?.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col w-full h-[50vh] items-center justify-center space-y-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <h2>Loading....</h2>
      </div>
    );
  }
  return (
    <div className="container mx-auto py-4 px-2 sm:px-4 md:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold mb-4">User Management</h1>
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {filteredUsers?.length === 0 ? (
        <div className="flex h-[40vh] flex-col items-center justify-center gap-4 rounded-lg border border-dashed p-8 text-center">
          <div className="text-xl font-semibold">No users found</div>
          <p className="text-muted-foreground">
            {searchQuery ? "Try adjusting your search terms." : "No users have signed up yet."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12 sm:w-14">User</TableHead>
                <TableHead>Details</TableHead>
                <TableHead className="hidden md:table-cell">Role</TableHead>
                <TableHead className="hidden lg:table-cell">Joined</TableHead>
                <TableHead className="w-20">Status</TableHead>
                <TableHead className="w-14">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers?.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <img
                      src={user.profilePicture || "/default-avatar.png"}
                      alt={user.name}
                      className="size-8 sm:size-10 rounded-full object-cover"
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{user.name}</span>
                      <span className="text-sm text-muted-foreground">{user.email}</span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Badge variant={
                      user.role === 'admin' ? 'destructive' : 
                      user.role === 'moderator' ? 'default' : 
                      'secondary'
                    }>
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-muted-foreground">
                    {formatDate(user.createdAt)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.isActive ? "default" : "destructive"}>
                      {user.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                  <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuSub>
                          <DropdownMenuSubTrigger>Update Role</DropdownMenuSubTrigger>
                          <DropdownMenuSubContent>
                            <DropdownMenuItem 
                              onClick={() => setUserToUpdateRole({ user, newRole: 'user' })}
                              className={user.role === 'user' ? 'bg-muted' : ''}
                            >
                              User
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => setUserToUpdateRole({ user, newRole: 'moderator' })}
                              className={user.role === 'moderator' ? 'bg-muted' : ''}
                            >
                              Moderator
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => setUserToUpdateRole({ user, newRole: 'admin' })}
                              className={user.role === 'admin' ? 'bg-muted' : ''}
                            >
                              Admin
                            </DropdownMenuItem>
                          </DropdownMenuSubContent>
                        </DropdownMenuSub>
                        <DropdownMenuItem 
                          onClick={() => setUserToToggle(user)}
                          className={user.isActive ? "text-destructive" : "text-primary"}
                        >
                          {user.isActive ? "Deactivate" : "Activate"}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <AlertDialog open={!!userToToggle} onOpenChange={() => setUserToToggle(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              {userToToggle?.isActive
                ? `This will prevent ${userToToggle?.name} from accessing the platform.`
                : `This will restore ${userToToggle?.name}'s access to the platform.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleToggleActive}
            >
              {userToToggle?.isActive ? "Deactivate User" : "Activate User"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={!!userToUpdateRole} onOpenChange={() => setUserToUpdateRole(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Update User Role</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to change {userToUpdateRole?.user.name}&apos;s role to {userToUpdateRole?.newRole}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleUpdateRole}>
              Update Role
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}