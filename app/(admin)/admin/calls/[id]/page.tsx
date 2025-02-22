// @ts-nocheck
"use client";
import React from "react";
import { format } from "date-fns";
import {
  AlertTriangle,
  Clock,
  PlayCircle,
  User2,
  Bot,
  Calendar,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

import { Call } from "@/lib/db/schema";
import { useParams } from "next/navigation";
import Image from "next/image";
import { fetcher } from "@/lib/utils";
import useSWR from "swr";

export default function CallDetailsPage() {
  const { id } = useParams<{ id: string }>(); // Get ID from route
  console.log("id", id);
  const { data: call, error, isLoading } = useSWR(`/api/calls/${id}`, fetcher);
  const duration = call?.duration || 0;
  const minutes = Math.floor(duration / 60);
  const seconds = duration % 60;
  if (isLoading) {
    return (
      <div className="flex flex-col w-full h-[50vh] items-center justify-center space-y-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <h2>Loading....</h2>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header Section */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold mb-2">Call Details</h1>
          <div className="flex items-center gap-2">
            <Badge
              variant={call?.status === "completed" ? "default" : "secondary"}
            >
              {call?.status}
            </Badge>
            <span className="text-muted-foreground">
              {call?.createdAt
                ? format(new Date(call?.createdAt), "PPp")
                : "N/A"}
            </span>
          </div>
        </div>
      </div>

      {/* Participants Connection Card */}
      {/* Participants Connection Card */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Call Participants</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* User Details */}
            <div className="flex-1 flex flex-row md:flex-row items-center gap-6">
              <div className="relative">
                <Image
                  src={call?.patientProfilePicture ?? "/default-avatar.png"}
                  alt={call?.name || "Patient"}  // Also changed this to match your data structure
                  width={80}
                  height={80}
                  className="rounded-full object-cover"
                />
                <User2 className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-1 h-6 w-6" />
              </div>
              <div className="text-center md:text-left">
                <h3 className="font-semibold text-lg">{call?.name}</h3>
                <p className="text-muted-foreground">Patient</p>
                <div className="text-sm space-y-1">
                  <p>Age: {call?.age}</p>
                  <p>Sex: {call?.sex}</p>
                </div>
              </div>
            </div>

            {/* Connection Design */}
            <div className="flex flex-col items-center gap-2">
              <div className="h-8 w-0.5 bg-border md:h-0.5 md:w-24" />
              <ArrowRight className="h-6 w-6 text-muted-foreground md:rotate-0 rotate-90" />
              <div className="text-sm text-muted-foreground">
                {minutes}m {seconds}s
              </div>
            </div>

            {/* Avatar Details */}
            <div className="flex-1 flex flex-row-reverse md:flex-row items-center gap-6 md:justify-end">
              <div className="text-center md:text-right">
                <h3 className="font-semibold text-lg">{call?.avatarName}</h3>
                <p className="text-muted-foreground">{call?.avatarRole}</p>
              </div>
              <div className="relative">
                {call?.avatarImage ? (
                  <img
                    src={call.avatarImage}
                    alt={call?.avatarName || "Avatar"}
                    className="w-20 h-20 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
                    <Bot className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
                <Bot className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-1 h-6 w-6" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Call Details Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Call Information</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-muted-foreground" />
              <span>
                {call?.createdAt &&
                  format(new Date(call?.createdAt), "MMMM dd, yyyy")}
              </span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-muted-foreground" />
              {call?.createdAt && (
                <span>
                  {format(new Date(call?.createdAt), "HH:mm")} -{" "}
                  {format(new Date(call?.endedAt), "HH:mm")}
                </span>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Duration:</span>
              <span>
                {minutes}m {seconds}s
              </span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Device:</span>
              <span>{call?.technicalDetails?.deviceType}</span>
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Recording Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PlayCircle className="h-5 w-5" />
            Recording
          </CardTitle>
        </CardHeader>
        <CardContent>
          <audio controls className="w-full" src={call?.recordingUrl}>
            Your browser does not support the audio element.
          </audio>
        </CardContent>
      </Card>

      {/* Alert Section */}
      {call.analysis?.is_flagged && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Attention Required</AlertTitle>
          <AlertDescription>
            {call?.analysis.alert_summary.description}
          </AlertDescription>
        </Alert>
      )}

      {/* Analysis Section */}
      <Card>
        <CardHeader>
          <CardTitle>Call Analysis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Key Points */}
          <div>
            <h3 className="font-semibold mb-2">Key Points</h3>
            <ul className="list-disc pl-6 space-y-2">
              {call?.analysis.key_points.map((point, index) => (
                <li key={index}>{point}</li>
              ))}
            </ul>
          </div>

          {/* Timeline */}
          <div>
            <h3 className="font-semibold mb-2">Timeline</h3>
            <div className="space-y-4">
              {call.analysis.call_timeline.map((timepoint, index) => (
                <div key={index} className="flex gap-4">
                  <div className="text-sm text-muted-foreground w-24">
                    {timepoint.timestamp}
                  </div>
                  <div>
                    {timepoint.discussion_points.map((point, i) => (
                      <p key={i}>{point}</p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Conversation Metrics */}
          <div>
            <h3 className="font-semibold mb-2">Conversation Metrics</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-muted rounded-lg">
                <div className="text-sm text-muted-foreground">Turns</div>
                <div className="text-2xl font-semibold">
                  {call.conversationMetrics.turnsCount}
                </div>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <div className="text-sm text-muted-foreground">
                  Avg Response
                </div>
                <div className="text-2xl font-semibold">
                  {call.conversationMetrics.avgResponseTime}s
                </div>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <div className="text-sm text-muted-foreground">
                  User Speaking
                </div>
                <div className="text-2xl font-semibold">
                  {call.conversationMetrics.userSpeakingTime}s
                </div>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <div className="text-sm text-muted-foreground">
                  Avatar Speaking
                </div>
                <div className="text-2xl font-semibold">
                  {call.conversationMetrics.avatarSpeakingTime}s
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
