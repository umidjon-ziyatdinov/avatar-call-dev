// @ts-nocheck
"use client";
import React, { useState } from 'react';
import { format } from 'date-fns';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import {
  AlertTriangle,
  PhoneCall,
  AlertOctagon,
  AlertCircle,
  ArrowRightCircle,
  MessageSquareWarning,
  FileWarning,
  Clock,
} from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { fetcher } from '@/lib/utils';

const severityConfig = {
  low: {
    icon: <AlertCircle className="w-4 h-4" />,
    color: "bg-yellow-100 text-yellow-800",
  },
  medium: {
    icon: <AlertTriangle className="w-4 h-4" />,
    color: "bg-orange-100 text-orange-800",
  },
  high: {
    icon: <AlertOctagon className="w-4 h-4" />,
    color: "bg-red-100 text-red-800",
  }
};

const AlertSummaryContent = ({ summary }) => (
  <div className="p-2 max-w-md space-y-3">
    <div className="flex items-center gap-2 text-sm">
      <Clock className="w-4 h-4 text-gray-500" />
      <span className="font-medium">Timestamp:</span>
      <span>{summary.timestamp}</span>
    </div>
    
    <div className="flex items-center gap-2 text-sm">
      <FileWarning className="w-4 h-4 text-gray-500" />
      <span className="font-medium">Alert Type:</span>
      <span>{summary.alert_type}</span>
    </div>
    
    <div className="space-y-2">
      <div className="flex items-start gap-2 text-sm">
        <MessageSquareWarning className="w-4 h-4 text-gray-500 mt-1" />
        <div>
          <div className="font-medium">Description:</div>
          <p className="text-sm text-gray-700">{summary.description}</p>
        </div>
      </div>
    </div>
    
    <div className="space-y-2">
      <div className="flex items-start gap-2 text-sm">
        <ArrowRightCircle className="w-4 h-4 text-gray-500 mt-1" />
        <div>
          <div className="font-medium">Recommended Follow-up:</div>
          <p className="text-sm text-gray-700">{summary.recommended_followup}</p>
        </div>
      </div>
    </div>
  </div>
);

export default function CallHistory() {
  const router = useRouter();
  const [avatarFilter, setAvatarFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Fetch both calls and users data
  const { data: callsResponse, error: callsError, isLoading: isCallsLoading } = useSWR('/api/calls', fetcher);
  const { data: usersResponse, error: usersError, isLoading: isUsersLoading } = useSWR('/api/users', fetcher);
  
  const calls = callsResponse?.data;
  const users = usersResponse?.data;


  // Create a map of users for quick lookup
  const usersMap = users?.reduce((acc, user) => {
    acc[user.id] = user;
    return acc;
  }, {}) || {};

  const filteredCalls = calls?.filter(call => {
    const user = usersMap[call.userId];
    const matchesAvatar = avatarFilter === "all" || call.metadata.avatarName === avatarFilter;
    const matchesSearch = !searchQuery || 
      call.metadata.avatarName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      call.userId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user?.id?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesAvatar && matchesSearch;
  });

  const uniqueAvatars = calls ? [...new Set(calls.map(call => call.metadata.avatarName))] : [];

  const handleRowClick = (callId) => {
    router.push(`/admin/calls/${callId}`);
  };

  const SeverityBadge = ({ severity, summary }) => {
    const config = severityConfig[severity.toLowerCase()];
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${config.color}`}>
              {config.icon}
              <span className="text-sm font-medium">{severity}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent side="left" className="bg-white border shadow-lg rounded-lg">
            <AlertSummaryContent summary={summary} />
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  if (callsError || usersError) return (
    <div className="p-4 text-center text-red-500">
      Failed to load data
    </div>
  );

  const isLoading = isCallsLoading || isUsersLoading;

  return (
    <div className="container mx-auto p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PhoneCall className="w-6 h-6" />
            Call History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="w-full md:w-1/3">
              <Input
                placeholder="Search by avatar, patient, or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="w-full md:w-1/3">
              <Select value={avatarFilter} onValueChange={setAvatarFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by avatar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Avatars</SelectItem>
                  {uniqueAvatars.map(avatar => (
                    <SelectItem key={avatar} value={avatar}>
                      {avatar}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Avatar</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Analysis Status</TableHead>
                  <TableHead>Flags</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array(5).fill(0).map((_, i) => (
                    <TableRow key={i}>
                      {Array(6).fill(0).map((_, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-4 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : filteredCalls?.map((call) => {
                  const user = usersMap[call.userId];
                  return (
                    <TableRow
                      key={call.id}
                      className="cursor-pointer hover:bg-accent"
                      onClick={() => handleRowClick(call.id)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full overflow-hidden">
                            <img 
                              src={call.avatarImage || "/api/placeholder/40/40"} 
                              alt={call.metadata.avatarName}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <span className="font-medium">{call.metadata.avatarName}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full overflow-hidden">
                            <img 
                              src={user?.image || "/api/placeholder/40/40"} 
                              alt={user?.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-medium">{user?.name || 'Unknown User'}</span>
                            <span className="text-sm text-gray-500">ID: {call.userId}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {format(new Date(call.createdAt), 'MMM d, yyyy HH:mm')}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <span>{Math.floor(call.duration / 60)}m {call.duration % 60}s</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={call.analysisComplete ? "success" : "secondary"}>
                          {call.analysisComplete ? "Completed" : "Processing"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {call.analysis.is_flagged && (
                          <SeverityBadge 
                            severity="high" 
                            summary={call.analysis.alert_summary} 
                          />
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filteredCalls?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      No calls found matching your filters
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}