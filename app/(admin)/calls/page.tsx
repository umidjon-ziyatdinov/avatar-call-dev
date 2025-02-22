// @ts-nocheck
'use client';
import React, { useCallback, useState } from 'react';
import { format } from 'date-fns';
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  PhoneCall,
  AlertOctagon,
  AlertCircle,
  ArrowRightCircle,
  MessageSquareWarning,
  FileWarning,
  Clock,
  Calendar as CalendarIcon,
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
  const [selectedPatient, setSelectedPatient] = useState("");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [filteredData, setFilteredData] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false)
  
  const { data: callsData, error: callsError, isLoading: isCallsLoading , mutate: mutateCalls } = useSWR('/api/calls', fetcher,  {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 600000, // 10 minutes
  });
  const { data: patientsData, error: patientsError, isLoading: patientsLoading } = useSWR('/api/patient', fetcher);
  const { data: avatarData, error: avatarError, isLoading: avatarLoading } = useSWR('/api/avatar', fetcher);
  const fetchFilteredCalls = useCallback(async () => {
    setSearchLoading(true)
    try {
      const filters = {
        userId: selectedPatient || undefined,
        avatarId: avatarFilter !== "all" ? avatarFilter : undefined,
        startDate: startDate,
        endDate: endDate
      };

      const response = await fetch('/api/calls/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(filters),
      });

      if (!response.ok) throw new Error('Failed to fetch filtered calls');
      
      const data = await response.json();
      setFilteredData(data?.data);
    } catch (error) {
      console.error('Error fetching filtered calls:', error);
    } finally{
      setSearchLoading(false)
    }
  }, [selectedPatient, avatarFilter, startDate, endDate]);

  // Reset filtered data when filters are cleared
  const resetFilters = () => {
    setAvatarFilter("all");
    setSelectedPatient("");
    setStartDate(undefined);
    setEndDate(undefined);
    setFilteredData(null);
  };

  const calls = filteredData || callsData?.data;
  const patients = patientsData;



  const handleRowClick = (callId) => {
    router.push(`/calls/${callId}`);
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

  if (callsError || patientsError) return (
    <div className="p-4 text-center text-red-500">
      Failed to load data
    </div>
  );

  const isLoading = isCallsLoading || patientsLoading;

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
            <div className="w-full md:w-1/4">
              <Select value={selectedPatient} onValueChange={setSelectedPatient}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Patient" />
                </SelectTrigger>
                <SelectContent>
                <SelectItem value="all">All Patients</SelectItem>
                  {patients?.map(patient => (
                    <SelectItem key={patient.id} value={patient.id}>
                      {patient.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="w-full md:w-1/4">
              <Select value={avatarFilter} onValueChange={setAvatarFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by avatar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Avatars</SelectItem>
                  {avatarData?.map(avatar => (
                    <SelectItem key={avatar.id} value={avatar?.id}>
                      {avatar?.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="w-full md:w-1/4">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, 'PP') : 'Select start date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="w-full md:w-1/4">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, 'PP') : 'Select end date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="flex justify-end mb-4 gap-4">
           <Button variant="outline" onClick={resetFilters}>
              Reset Filters
            </Button>
            <Button onClick={fetchFilteredCalls}>
              Apply Filters
            </Button>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Avatar</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Analysis Status</TableHead>
                  <TableHead>Flags</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isCallsLoading || searchLoading ? (
                  Array(5).fill(0).map((_, i) => (
                    <TableRow key={i}>
                      {Array(6).fill(0).map((_, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-4 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : calls?.map((call) => (
                  <TableRow
                    key={call.callId}
                    className="cursor-pointer hover:bg-accent"
                    onClick={() => handleRowClick(call.id)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden">
                          <img 
                            src={call.avatarImage || "/api/placeholder/40/40"} 
                            alt={call.avatarName}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <span className="font-medium">{call.avatarName}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full overflow-hidden">
                          <img 
                            src={call.patientProfilePicture || "/api/placeholder/32/32"} 
                            alt={call.patientName}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-medium">{call.patientName}</span>
                          <span className="text-sm text-gray-500">{call.patientEmail}</span>
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
                      <Badge variant={call.status === "completed" ? "success" : "secondary"}>
                        {call.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {call.analysis?.is_flagged && (
                        <SeverityBadge 
                          severity={call.analysis.severity || "high"} 
                          summary={call.analysis.alert_summary} 
                        />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {!calls?.length && (
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