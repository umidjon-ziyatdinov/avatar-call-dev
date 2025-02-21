"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Settings } from "lucide-react";
import ChatScreen from "./chat-screen";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar } from "@/lib/db/schema";
import useSWR from "swr";
import { fetcher } from "@/lib/utils";

export default function ChatPage({ avatarId }: { avatarId: string }) {
  const router = useRouter();
  const { data: avatar, isLoading, mutate: refetchAvatars } = useSWR<Avatar>(`/api/avatar/${avatarId}`, fetcher);


  useEffect(() => {
    if (!avatarId) {
      return;
    }

  }, [avatarId]);

  const handleBack = () => {
    router.push("/");
  };

  if (isLoading) {
    return (
      <div className="flex w-full h-screen items-center justify-center bg-background">
        <div className="flex w-full flex-col items-center justify-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading conversation...</p>
        </div>
      </div>
    );
  }

  if (!avatar) {
    return null;
  }

  return (
    <div className="min-h-fit bg-background p-4 transition-colors w-full">
      <div className="mx-auto w-full flex max-w-6xl flex-col">
        {/* Header */}
        <Card className="mb-6">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-4">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleBack}
                      className="rounded-full"
                    >
                      <ArrowLeft className="size-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Return to avatar selection</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <div className="flex items-center gap-4">
                <div className="relative">
                {avatar.avatarImage &&  <img
                    src={avatar.avatarImage}
                    alt={avatar.name}
                    className="size-12 rounded-full object-cover ring-2 ring-primary/20 transition-all"
                  />}
                  <div className="absolute bottom-0 right-0 size-3 rounded-full bg-green-500 ring-2 ring-background" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold">{avatar.name}</h1>
                  <p className="text-sm text-muted-foreground">{avatar.role}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="hidden text-right sm:block">
                <p className="text-sm text-muted-foreground">AI Model</p>
                <p className="text-sm font-medium text-primary">
                  {avatar.openaiModel}
                </p>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <Settings className="size-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Chat Settings</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="flex justify-between">
                    Model
                    <span className="text-xs font-medium text-primary">
                      {avatar.openaiModel}
                    </span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="flex justify-between">
                    Voice
                    <span className="text-xs font-medium text-primary">
                      {avatar.openaiVoice}
                    </span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </Card>

        {/* Chat Area */}
        <Card className="w-full p-0">
          <div className="flex justify-center">
            <ChatScreen avatar={avatar} onBack={handleBack} />
          </div>
        </Card>
      </div>
    </div>
  );
}
