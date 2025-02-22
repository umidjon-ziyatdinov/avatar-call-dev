'use client';


import { useState } from "react";
import useSWR from "swr";
import { MoreHorizontal, Search, Plus, Pencil } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface AdminFormData {
  name: string;
  email: string;
  password: string;
  passcode: string;
}

export default function AdminManagementPage() {
  const [adminToToggle, setAdminToToggle] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<User | null>(null);
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [newAdminData, setNewAdminData] = useState<AdminFormData>({
    name: "",
    email: "",
    password: "",
    passcode: "",
  });
  const [updateAdminData, setUpdateAdminData] = useState<AdminFormData>({
    name: "",
    email: "",
    password: "",
    passcode: "",
  });

  const {
    data: adminList,
    isLoading,
    mutate,
  } = useSWR<Array<User>>("/api/super-admin", fetcher, {
    fallbackData: [],
  });

  const handleOpenUpdateDialog = (admin: User) => {
    setSelectedAdmin(admin);
    setUpdateAdminData({
      name: admin.name,
      email: admin.email,
      password: "",
      passcode: admin.passcode.toString(),
    });
    setIsUpdateDialogOpen(true);
  };

  const handleUpdateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdmin) return;

    try {
      const formData = new FormData();
      formData.append("name", updateAdminData.name);
      formData.append("email", updateAdminData.email);
      if (updateAdminData.password) {
        formData.append("password", updateAdminData.password);
      }
      formData.append("passcode", updateAdminData.passcode);
      if (profilePicture) {
        formData.append("profilePicture", profilePicture);
      }

      const response = await fetch(`/api/super-admin/${selectedAdmin.id}`, {
        method: "PATCH",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to update admin");
      }

      mutate();
      setIsUpdateDialogOpen(false);
      setSelectedAdmin(null);
      setProfilePicture(null);
      toast.success("Admin updated successfully!");
    } catch (error) {
      toast.error("Failed to update admin.");
      console.error("Failed to update admin:", error);
    }
  };

  const handleToggleActive = async () => {
    if (!adminToToggle) return;

    try {
      const formData = new FormData();
      formData.append("isActive", (!adminToToggle.isActive).toString());

      const response = await fetch(`/api/super-admin/${adminToToggle.id}`, {
        method: "PATCH",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to update admin status");
      }

      mutate();
      toast.success(`Admin ${adminToToggle.isActive ? "deactivated" : "activated"} successfully!`);
    } catch (error) {
      toast.error("Failed to update admin status.");
      console.error("Failed to update admin status:", error);
    } finally {
      setAdminToToggle(null);
    }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const formData = new FormData();
      formData.append("email", newAdminData.email);
      formData.append("password", newAdminData.password);
      formData.append("name", newAdminData.name);
      formData.append("passcode", newAdminData.passcode);
      if (profilePicture) {
        formData.append("profilePicture", profilePicture);
      }

      const response = await fetch("/api/super-admin", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to create admin");
      }

      mutate();
      setIsCreateDialogOpen(false);
      setNewAdminData({ name: "", email: "", password: "", passcode: "" });
      setProfilePicture(null);
      toast.success("Admin created successfully!");
    } catch (error) {
      toast.error("Failed to create admin.");
      console.error("Failed to create admin:", error);
    }
  };

  const handleDeleteAdmin = async (adminId: string) => {
    try {
      const response = await fetch(`/api/super-admin/${adminId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete admin");
      }

      mutate();
      toast.success("Admin deleted successfully!");
    } catch (error) {
      toast.error("Failed to delete admin.");
      console.error("Failed to delete admin:", error);
    }
  };

  const filteredAdmins = adminList?.filter(admin => 
    admin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    admin.email.toLowerCase().includes(searchQuery.toLowerCase())
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
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl sm:text-3xl font-bold">Admin Management</h1>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Admin
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleCreateAdmin}>
                <DialogHeader>
                  <DialogTitle>Create New Admin</DialogTitle>
                  <DialogDescription>
                    Add a new administrator to the system.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={newAdminData.name}
                      onChange={(e) => setNewAdminData({...newAdminData, name: e.target.value})}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newAdminData.email}
                      onChange={(e) => setNewAdminData({...newAdminData, email: e.target.value})}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={newAdminData.password}
                      onChange={(e) => setNewAdminData({...newAdminData, password: e.target.value})}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="passcode">Passcode</Label>
                    <Input
                      id="passcode"
                      type="number"
                      value={newAdminData.passcode}
                      onChange={(e) => setNewAdminData({...newAdminData, passcode: e.target.value})}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="profilePicture">Profile Picture</Label>
                    <Input
                      id="profilePicture"
                      type="file"
                      accept="image/*"
                      onChange={(e) => setProfilePicture(e.target.files?.[0] || null)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">Create Admin</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search admins..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {filteredAdmins?.length === 0 ? (
        <div className="flex h-[40vh] flex-col items-center justify-center gap-4 rounded-lg border border-dashed p-8 text-center">
          <div className="text-xl font-semibold">No admins found</div>
          <p className="text-muted-foreground">
            {searchQuery ? "Try adjusting your search terms." : "No administrators have been added yet."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12 sm:w-14">Admin</TableHead>
                <TableHead>Details</TableHead>
                <TableHead className="hidden lg:table-cell">Joined</TableHead>
                <TableHead className="w-20">Status</TableHead>
                <TableHead className="w-14">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAdmins?.map((admin) => (
                <TableRow key={admin.id}>
                  <TableCell>
                    <img
                      src={admin.profilePicture || "/default-avatar.png"}
                      alt={admin.name}
                      className="size-8 sm:size-10 rounded-full object-cover"
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{admin.name}</span>
                      <span className="text-sm text-muted-foreground">{admin.email}</span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-muted-foreground">
                    {formatDate(admin.createdAt)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={admin.isActive ? "default" : "destructive"}>
                      {admin.isActive ? "Active" : "Inactive"}
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
                        <DropdownMenuItem onClick={() => handleOpenUpdateDialog(admin)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => setAdminToToggle(admin)}
                          className={admin.isActive ? "text-destructive" : "text-primary"}
                        >
                          {admin.isActive ? "Deactivate" : "Activate"}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDeleteAdmin(admin.id)}
                          className="text-destructive"
                        >
                          Delete
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

      {/* Update Dialog */}
      <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
      <DialogContent>
        <form onSubmit={handleUpdateAdmin}>
          <DialogHeader>
            <DialogTitle>Update Admin</DialogTitle>
            <DialogDescription>
              Update administrator information.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="update-name">Name</Label>
              <Input
                id="update-name"
                value={updateAdminData.name}
                onChange={(e) => setUpdateAdminData({...updateAdminData, name: e.target.value})}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="update-email">Email</Label>
              <Input
                id="update-email"
                type="email"
                value={updateAdminData.email}
                onChange={(e) => setUpdateAdminData({...updateAdminData, email: e.target.value})}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="update-password">
                New Password
                <span className="text-sm text-muted-foreground ml-2">(Leave blank to keep current)</span>
              </Label>
              <Input
                id="update-password"
                type="password"
                value={updateAdminData.password}
                onChange={(e) => setUpdateAdminData({...updateAdminData, password: e.target.value})}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="update-passcode">Passcode</Label>
              <Input
                id="update-passcode"
                type="number"
                value={updateAdminData.passcode}
                onChange={(e) => setUpdateAdminData({...updateAdminData, passcode: e.target.value})}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="update-profilePicture">
                Profile Picture
                <span className="text-sm text-muted-foreground ml-2">(Optional)</span>
              </Label>
              <Input
                id="update-profilePicture"
                type="file"
                accept="image/*"
                onChange={(e) => setProfilePicture(e.target.files?.[0] || null)}
              />
            </div>
            {selectedAdmin?.profilePicture && (
              <div className="flex items-center gap-2">
                <img
                  src={selectedAdmin.profilePicture}
                  alt="Current profile picture"
                  className="w-10 h-10 rounded-full object-cover"
                />
                <span className="text-sm text-muted-foreground">Current profile picture</span>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsUpdateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Update Admin</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    {/* Toggle Status Dialog */}
    <AlertDialog open={!!adminToToggle} onOpenChange={() => setAdminToToggle(null)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            {adminToToggle?.isActive
              ? `This will prevent ${adminToToggle?.name} from accessing the admin panel.`
              : `This will restore ${adminToToggle?.name}'s access to the admin panel.`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleToggleActive}>
            {adminToToggle?.isActive ? "Deactivate Admin" : "Activate Admin"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
);
}