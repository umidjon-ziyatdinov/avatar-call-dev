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

interface ModeratorFormData {
  name: string;
  email: string;
  password: string;
  passcode: string;
}

export default function ModeratorManagementPage() {
  const [moderatorToToggle, setModeratorToToggle] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [selectedModerator, setSelectedModerator] = useState<User | null>(null);
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [newModeratorData, setNewModeratorData] = useState<ModeratorFormData>({
    name: "",
    email: "",
    password: "",
    passcode: "",
  });
  const [updateModeratorData, setUpdateModeratorData] = useState<ModeratorFormData>({
    name: "",
    email: "",
    password: "",
    passcode: "",
  });

  const {
    data: moderatorList,
    isLoading,
    mutate,
  } = useSWR<Array<User>>("/api/moderator", fetcher, {
    fallbackData: [],
  });

  const handleOpenUpdateDialog = (moderator: User) => {
    setSelectedModerator(moderator);
    setUpdateModeratorData({
      name: moderator.name,
      email: moderator.email,
      password: "",
      passcode: moderator.passcode.toString(),
    });
    setIsUpdateDialogOpen(true);
  };

  const handleUpdateModerator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedModerator) return;

    try {
      const formData = new FormData();
      formData.append("name", updateModeratorData.name);
      formData.append("email", updateModeratorData.email);
      if (updateModeratorData.password) {
        formData.append("password", updateModeratorData.password);
      }
      formData.append("passcode", updateModeratorData.passcode);
      if (profilePicture) {
        formData.append("profilePicture", profilePicture);
      }

      const response = await fetch(`/api/moderator/${selectedModerator.id}`, {
        method: "PATCH",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to update moderator");
      }

      mutate();
      setIsUpdateDialogOpen(false);
      setSelectedModerator(null);
      setProfilePicture(null);
      toast.success("Moderator updated successfully!");
    } catch (error) {
      toast.error("Failed to update moderator.");
      console.error("Failed to update moderator:", error);
    }
  };

  const handleToggleActive = async () => {
    if (!moderatorToToggle) return;

    try {
      const formData = new FormData();
      formData.append("isActive", (!moderatorToToggle.isActive).toString());

      const response = await fetch(`/api/moderator/${moderatorToToggle.id}`, {
        method: "PATCH",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to update moderator status");
      }

      mutate();
      toast.success(`Moderator ${moderatorToToggle.isActive ? "deactivated" : "activated"} successfully!`);
    } catch (error) {
      toast.error("Failed to update moderator status.");
      console.error("Failed to update moderator status:", error);
    } finally {
      setModeratorToToggle(null);
    }
  };

  const handleCreateModerator = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const formData = new FormData();
      formData.append("email", newModeratorData.email);
      formData.append("password", newModeratorData.password);
      formData.append("name", newModeratorData.name);
      formData.append("passcode", newModeratorData.passcode);
      if (profilePicture) {
        formData.append("profilePicture", profilePicture);
      }

      const response = await fetch("/api/moderator", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to create moderator");
      }

      mutate();
      setIsCreateDialogOpen(false);
      setNewModeratorData({ name: "", email: "", password: "", passcode: "" });
      setProfilePicture(null);
      toast.success("Moderator created successfully!");
    } catch (error) {
      toast.error("Failed to create moderator.");
      console.error("Failed to create moderator:", error);
    }
  };

  const handleDeleteModerator = async (moderatorId: string) => {
    try {
      const response = await fetch(`/api/moderator/${moderatorId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete moderator");
      }

      mutate();
      toast.success("Moderator deleted successfully!");
    } catch (error) {
      toast.error("Failed to delete moderator.");
      console.error("Failed to delete moderator:", error);
    }
  };

  const filteredModerators = moderatorList?.filter(moderator => 
    moderator.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    moderator.email.toLowerCase().includes(searchQuery.toLowerCase())
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
          <h1 className="text-2xl sm:text-3xl font-bold">Moderator Management</h1>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Moderator
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleCreateModerator}>
                <DialogHeader>
                  <DialogTitle>Create New Moderator</DialogTitle>
                  <DialogDescription>
                    Add a new moderator to the system.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={newModeratorData.name}
                      onChange={(e) => setNewModeratorData({...newModeratorData, name: e.target.value})}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newModeratorData.email}
                      onChange={(e) => setNewModeratorData({...newModeratorData, email: e.target.value})}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={newModeratorData.password}
                      onChange={(e) => setNewModeratorData({...newModeratorData, password: e.target.value})}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="passcode">Passcode</Label>
                    <Input
                      id="passcode"
                      type="number"
                      value={newModeratorData.passcode}
                      onChange={(e) => setNewModeratorData({...newModeratorData, passcode: e.target.value})}
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
                  <Button type="submit">Create Moderator</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search moderators..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {filteredModerators?.length === 0 ? (
        <div className="flex h-[40vh] flex-col items-center justify-center gap-4 rounded-lg border border-dashed p-8 text-center">
          <div className="text-xl font-semibold">No moderators found</div>
          <p className="text-muted-foreground">
            {searchQuery ? "Try adjusting your search terms." : "No moderators have been added yet."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12 sm:w-14">Moderator</TableHead>
                <TableHead>Details</TableHead>
                <TableHead className="hidden lg:table-cell">Joined</TableHead>
                <TableHead className="w-20">Status</TableHead>
                <TableHead className="w-14">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredModerators?.map((moderator) => (
                <TableRow key={moderator.id}>
                  <TableCell>
                    <img
                      src={moderator.profilePicture || "/default-avatar.png"}
                      alt={moderator.name}
                      className="size-8 sm:size-10 rounded-full object-cover"
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{moderator.name}</span>
                      <span className="text-sm text-muted-foreground">{moderator.email}</span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-muted-foreground">
                    {formatDate(moderator.createdAt)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={moderator.isActive ? "default" : "destructive"}>
                      {moderator.isActive ? "Active" : "Inactive"}
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
                        <DropdownMenuItem onClick={() => handleOpenUpdateDialog(moderator)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => setModeratorToToggle(moderator)}
                          className={moderator.isActive ? "text-destructive" : "text-primary"}
                        >
                          {moderator.isActive ? "Deactivate" : "Activate"}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDeleteModerator(moderator.id)}
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
          <form onSubmit={handleUpdateModerator}>
            <DialogHeader>
              <DialogTitle>Update Moderator</DialogTitle>
              <DialogDescription>
                Update moderator information.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {/* Previous code remains the same until the Update Dialog form fields */}
              <div className="grid gap-2">
                <Label htmlFor="update-name">Name</Label>
                <Input
                  id="update-name"
                  value={updateModeratorData.name}
                  onChange={(e) => setUpdateModeratorData({...updateModeratorData, name: e.target.value})}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="update-email">Email</Label>
                <Input
                  id="update-email"
                  type="email"
                  value={updateModeratorData.email}
                  onChange={(e) => setUpdateModeratorData({...updateModeratorData, email: e.target.value})}
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
                  value={updateModeratorData.password}
                  onChange={(e) => setUpdateModeratorData({...updateModeratorData, password: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="update-passcode">Passcode</Label>
                <Input
                  id="update-passcode"
                  type="number"
                  value={updateModeratorData.passcode}
                  onChange={(e) => setUpdateModeratorData({...updateModeratorData, passcode: e.target.value})}
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
              {selectedModerator?.profilePicture && (
                <div className="flex items-center gap-2">
                  <img
                    src={selectedModerator.profilePicture}
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
              <Button type="submit">Update Moderator</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Toggle Status Dialog */}
      <AlertDialog open={!!moderatorToToggle} onOpenChange={() => setModeratorToToggle(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              {moderatorToToggle?.isActive
                ? `This will prevent ${moderatorToToggle?.name} from accessing the moderator panel.`
                : `This will restore ${moderatorToToggle?.name}'s access to the moderator panel.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleToggleActive}>
              {moderatorToToggle?.isActive ? "Deactivate Moderator" : "Activate Moderator"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}