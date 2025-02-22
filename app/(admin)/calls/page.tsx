// @ts-nocheck
import React, { useState } from 'react';
import useSWR from 'swr';
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
import { Input } from "@/components/ui/input";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  PhoneCall,
  PhoneMissed,
} from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { fetcher } from '@/lib/utils';
import { useRouter } from 'next/navigation';



const statusIcons = {
  active: <Clock className="w-4 h-4 text-yellow-500" />,
  completed: <CheckCircle2 className="w-4 h-4 text-green-500" />,
  failed: <AlertCircle className="w-4 h-4 text-red-500" />,
  missed: <PhoneMissed className="w-4 h-4 text-gray-500" />
};

export default function CallHistory() {
  const router = useRouter();
  const [avatarFilter, setAvatarFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  
  const { data: calls, error, isLoading } = useSWR('/api/calls', fetcher);

  const filteredCalls = calls?.filter(call => {
    const matchesAvatar = !avatarFilter || call.metadata.avatarName === avatarFilter;
    const matchesSearch = !searchQuery || 
      call.metadata.avatarName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      call.userId.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesAvatar && matchesSearch;
  });

  const uniqueAvatars = calls ? [...new Set(calls.map(call => call.metadata.avatarName))] : [];

  const handleRowClick = (callId) => {
    router.push(`/admin/calls/${callId}`);
  };

  if (error) return (
    <div className="p-4 text-center text-red-500">
      Failed to load call history
    </div>
  );

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
                placeholder="Search by avatar or user ID..."
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
                  <SelectItem value="">All Avatars</SelectItem>
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
                  <TableHead>Status</TableHead>
                  <TableHead>Avatar</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead className="hidden md:table-cell">Quality</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array(5).fill(0).map((_, i) => (
                    <TableRow key={i}>
                      {Array(5).fill(0).map((_, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-4 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : filteredCalls?.map((call) => (
                  <TableRow
                    key={call.id}
                    className="cursor-pointer hover:bg-accent"
                    onClick={() => handleRowClick(call.id)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {statusIcons[call.status]}
                        <span className="hidden md:inline">
                          {call.status.charAt(0).toUpperCase() + call.status.slice(1)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {call.metadata.avatarName}
                    </TableCell>
                    <TableCell>
                      {Math.floor(call.duration / 60)}m {call.duration % 60}s
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex gap-2">
                        <Badge variant={call.qualityMetrics.audioQuality > 80 ? "success" : "destructive"}>
                          Audio: {call.qualityMetrics.audioQuality}%
                        </Badge>
                        <Badge variant={call.qualityMetrics.videoQuality > 80 ? "success" : "destructive"}>
                          Video: {call.qualityMetrics.videoQuality}%
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      {format(new Date(call.createdAt), 'MMM d, yyyy HH:mm')}
                    </TableCell>
                  </TableRow>
                ))}
                {filteredCalls?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
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