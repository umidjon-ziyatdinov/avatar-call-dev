"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { User2, Shield, Clock, Settings, Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { fetcher } from "@/lib/utils";
import useSWR from "swr";

import { Avatar } from "@/lib/db/schema";
import Image from "next/image";
import AdminScreen from "./components/AdminScreen";

interface AvatarSettings {
  id: string;
  name: string;
  role: string;
  avatar: string;
  openai_voice: string;
  openai_model: string;
  simli_faceid: string;
  initialPrompt: string;
  lastMessage?: string;
  lastMessageTime?: string;
}

interface AuthResponse {
  success: boolean;
  user?: {
    role: string;
    name: string;
    id: string;
  };
  error?: string;
}

const NumPadButton = ({
  children,
  onClick,
  disabled = false,
  className = "",
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}) => (
  <button
    className={`h-16 w-16 rounded-full bg-background text-2xl transition-colors 
      ${
        disabled
          ? "opacity-50 cursor-not-allowed"
          : "hover:bg-transparent active:bg-muted/80"
      }
      ${className}`}
    onClick={onClick}
    disabled={disabled}
  >
    {children}
  </button>
);

const PasscodeScreen = ({
  onSubmit,
  isAuthenticating,
}: {
  onSubmit: (code: string) => void;
  isAuthenticating: boolean;
}) => {
  const [passcode, setPasscode] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleNumberPress = async (num: number) => {
    if (isAuthenticating || isSubmitting) return;

    if (passcode.length < 4) {
      const newPasscode = passcode + num;
      setPasscode(newPasscode);

      if (newPasscode.length === 4) {
        setIsSubmitting(true);
        await onSubmit(newPasscode);
        setPasscode("");
        setIsSubmitting(false);
      }
    }
  };

  const handleDelete = () => {
    if (isAuthenticating || isSubmitting) return;
    setPasscode((prev) => prev.slice(0, -1));
  };

  return (
    <div className="flex flex-col items-center gap-8 p-6">
      <h2 className="text-2xl font-semibold">Enter Admin Passcode</h2>

      {/* Passcode dots */}
      <div className="flex gap-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className={`h-4 w-4 rounded-full transition-all duration-200 ${
              isAuthenticating
                ? "animate-pulse bg-primary/50"
                : passcode.length > i
                ? "bg-primary"
                : "bg-muted"
            }`}
          />
        ))}
      </div>

      {/* Loading indicator */}
      {isAuthenticating && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {/* Number pad */}
      <div className="grid grid-cols-3 gap-4">
        {/* Numbers 1-9 */}
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <NumPadButton
            key={num}
            onClick={() => handleNumberPress(num)}
            disabled={isAuthenticating || isSubmitting}
          >
            {num}
          </NumPadButton>
        ))}
        {/* Bottom row */}
        <div className="h-16 w-16" /> {/* Empty space */}
        <NumPadButton
          onClick={() => handleNumberPress(0)}
          disabled={isAuthenticating || isSubmitting}
        >
          0
        </NumPadButton>
        <NumPadButton
          onClick={handleDelete}
          disabled={isAuthenticating || isSubmitting}
          className="text-sm"
        >
          Delete
        </NumPadButton>
      </div>

      {/* Error message */}
      {isAuthenticating && (
        <p className="text-sm text-muted-foreground">Verifying passcode...</p>
      )}
    </div>
  );
};

export default function HomePage() {
  const router = useRouter();

  const { data: avatars, isLoading } = useSWR<Avatar[]>("/api/avatar", fetcher);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const handleSelectAvatar = (avatarId: string) => {
    router.push(`/chat/${avatarId}`);
  };

  const handlePasscodeSubmit = async (code: string) => {
    setIsAuthenticating(true);
    try {
      const response = await fetch("/api/patient/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode: code }),
      });

      const data: AuthResponse = await response.json();

      if (data.success && data.user) {
        if (data.user) {
          setIsAdmin(true);
          toast.success(`Welcome to Admin Dashboard, ${data.user.name}`);
        } else {
          toast.error("Access denied. Admin privileges required.");
        }
      } else {
        toast.error(data.error || "Invalid passcode");
      }
    } catch (error) {
      console.error("Authorization failed:", error);
      toast.error("Authentication failed. Please try again.");
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <>
      <div className="h-full bg-background p-4 w-full max-w-full">
        <div defaultValue="chats" className="w-full max-w-3xl mx-auto">
          <AdminScreen />
        </div>
      </div>
    </>
  );
}
