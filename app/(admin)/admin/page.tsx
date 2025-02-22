
"use client";
import { useState } from "react";
import useSWR from "swr";
import { Plus, Pencil, Trash2, MoreHorizontal, Upload } from "lucide-react";
import { toast } from "sonner"; // Import toast
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { fetcher } from "@/lib/utils";
import type { Avatar } from "@/lib/db/schema";
import { AvatarForm } from "@/components/AvatarEditForm";


const OPENAI_VOICES = [
  "alloy",
  "ash",
  "ballad",
  "coral",
  "echo",
  "sage",
  "shimmer",
  "verse",
] as const;

const OPENAI_MODELS = [
  "gpt-4o-realtime-preview",
  "gpt-4-turbo",
  "gpt-4",
  "gpt-3.5-turbo",
] as const;

export default function AvatarAdminPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingAvatar, setEditingAvatar] = useState<Avatar | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [avatarToDelete, setAvatarToDelete] = useState<Avatar | null>(null);
  const {
    data: avatarList,
    isLoading,
    mutate,
  } = useSWR<Array<Avatar>>("/api/avatar", fetcher, {
    fallbackData: [],
  });

  const handleCreate = async (formData: FormData) => {
    try {
      setIsCreating(true);
      const response = await fetch("/api/avatar", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to create avatar");
      }

      setIsCreateOpen(false);
      mutate();
      toast.success("Avatar created successfully!");
    } catch (error) {
      toast.error("Failed to create avatar.");
      console.error("Failed to create avatar:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdate = async (id: string, formData: FormData) => {
    try {
      setIsUpdating(true);
      formData.append("id", id);
      const response = await fetch("/api/admin/avatar", {
        method: "PUT",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to update avatar");
      }

      setEditingAvatar(null);
      mutate();
      toast.success("Avatar updated successfully!");
    } catch (error) {
      toast.error("Failed to update avatar.");
      console.error("Failed to update avatar:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!avatarToDelete) return;

    try {
      const response = await fetch(`/api/avatar?id=${avatarToDelete.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete avatar");
      }

      mutate();
      toast.success("Avatar deleted successfully!");
    } catch (error) {
      toast.error("Failed to delete avatar.");
      console.error("Failed to delete avatar:", error);
    } finally {
      setAvatarToDelete(null);
    }
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
    <div className="container mx-auto py-8  w-full">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Avatars</h1>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 size-4" />
              Create Avatar
            </Button>
          </DialogTrigger>
          <DialogContent className=" h-svh sm:max-h-[90vh] overflow-y-auto sm:max-w-[1000px] px-0">
            <DialogHeader className="px-4">
              <DialogTitle>Create New Avatar</DialogTitle>
            </DialogHeader>
            <AvatarForm onClose={() => {setIsCreateOpen(false); mutate()}} createEndpoint="/api/avatar?public=true" />
          </DialogContent>
        </Dialog>
      </div>

      {avatarList?.length === 0 ? (
        <div className="flex h-[40vh] flex-col items-center justify-center gap-4 rounded-lg border border-dashed p-8 text-center">
          <div className="text-xl font-semibold">No avatars found</div>
          <p className="text-muted-foreground">
            Get started by creating your first avatar.
          </p>
        </div>
      ) : (
        <div className="relative w-full">
        <div className="rounded-md border overflow-hidden">
          <div className="overflow-x-auto">
            <div className="inline-block min-w-full align-middle">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap">Avatar</TableHead>
                    <TableHead className="whitespace-nowrap">Name</TableHead>
                    <TableHead className="whitespace-nowrap">Role</TableHead>
                    <TableHead className="whitespace-nowrap">Voice</TableHead>
                    <TableHead className="whitespace-nowrap">Model</TableHead>
                    <TableHead className="w-[80px] whitespace-nowrap">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {avatarList?.map((avatar) => (
                    <TableRow key={avatar.id}>
                      <TableCell>
                      {avatar.avatarImage &&   <img
                          src={avatar.avatarImage}
                          alt={avatar.name}
                          className="size-10 rounded-full object-cover"
                        />}
                      </TableCell>
                      <TableCell className="font-medium whitespace-nowrap">{avatar.name}</TableCell>
                      <TableCell className="whitespace-nowrap">{avatar.role}</TableCell>
                      <TableCell className="whitespace-nowrap">{avatar.openaiVoice}</TableCell>
                      <TableCell className="whitespace-nowrap">{avatar.openaiModel}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setEditingAvatar(avatar)}>
                              <Pencil className="mr-2 size-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => setAvatarToDelete(avatar)}
                            >
                              <Trash2 className="mr-2 size-4" />
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
          </div>
        </div>
      </div>
      )}
      
      {editingAvatar && (
        <Dialog open={!!editingAvatar} onOpenChange={() => setEditingAvatar(null)} >
          <DialogContent className="h-svh  sm:max-h-[90vh] overflow-y-auto sm:max-w-[600px] px-0">
            <DialogHeader>
              <DialogTitle>Edit Avatar</DialogTitle>
            </DialogHeader>
            <AvatarForm
              avatar={editingAvatar}
              onClose={() => {setEditingAvatar(null); mutate()}}
           
            />
          </DialogContent>
        </Dialog>
      )}

      <AlertDialog open={!!avatarToDelete} onOpenChange={() => setAvatarToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the avatar
              &quot;{avatarToDelete?.name}&quot; and remove it from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Avatar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}


