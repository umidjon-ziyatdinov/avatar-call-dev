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

// Define Patient interface based on the API response
interface Patient {
  id: string;
  name: string;
  email: string;
  profilePicture?: string;
  age?: string;
  sex?: string;
  location?: string;
  fallRisk?: 'yes' | 'no';
  createdAt: Date;
  userIsActive?: boolean;
}

interface PatientFormData {
  name: string;
  email: string;
  password: string;
  about?: string;
  age?: string;
  sex?: string;
  dateOfBirth?: string;
  location?: string;
  education?: string;
  work?: string;
  fallRisk?: 'yes' | 'no';
  likes?: string;
  dislikes?: string;
  symptoms?: string;
  profilePicture?: File | null;
}

export default function PatientManagementPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [newPatientData, setNewPatientData] = useState<PatientFormData>({
    name: "",
    email: "",
    password: "",
    about: "",
    age: "",
    sex: "",
    dateOfBirth: "",
    location: "",
    education: "",
    work: "",
    fallRisk: "no",
    likes: "",
    dislikes: "",
    symptoms: "",
    profilePicture: null,
  });
  const [updatePatientData, setUpdatePatientData] = useState<PatientFormData>({
    name: "",
    email: "",
    password: "",
    about: "",
    age: "",
    sex: "",
    dateOfBirth: "",
    location: "",
    education: "",
    work: "",
    fallRisk: "no",
    likes: "",
    dislikes: "",
    symptoms: "",
    profilePicture: null,
  });

  // Fetch patients
  const {
    data: patientList,
    isLoading,
    mutate,
  } = useSWR<Array<Patient>>("/api/patient", fetcher, {
    fallbackData: [],
  });

  // Open update dialog
  const handleOpenUpdateDialog = (patient: Patient) => {
    setSelectedPatient(patient);
    setUpdatePatientData({
      name: patient.name,
      email: patient.email,
      password: "",
      about: "",
      age: patient.age || "",
      sex: patient.sex || "",
      location: patient.location || "",
      fallRisk: patient.fallRisk || "no",
      profilePicture: null,
      dateOfBirth: "",
      education: "",
      work: "",
      likes: "",
      dislikes: "",
      symptoms: "",
    });
    setIsUpdateDialogOpen(true);
  };

  // Update patient
  const handleUpdatePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return;

    try {
      const formData = new FormData();
      formData.append("name", updatePatientData.name);
      formData.append("email", updatePatientData.email);
      
      // Only append password if it's not empty
      if (updatePatientData.password) {
        formData.append("password", updatePatientData.password);
      }

      // Append optional fields
      if (updatePatientData.about) formData.append("about", updatePatientData.about);
      if (updatePatientData.age) formData.append("age", updatePatientData.age);
      if (updatePatientData.sex) formData.append("sex", updatePatientData.sex);
      if (updatePatientData.dateOfBirth) formData.append("dateOfBirth", updatePatientData.dateOfBirth);
      if (updatePatientData.location) formData.append("location", updatePatientData.location);
      if (updatePatientData.education) formData.append("education", updatePatientData.education);
      if (updatePatientData.work) formData.append("work", updatePatientData.work);
      if (updatePatientData.fallRisk) formData.append("fallRisk", updatePatientData.fallRisk);
      if (updatePatientData.likes) formData.append("likes", updatePatientData.likes);
      if (updatePatientData.dislikes) formData.append("dislikes", updatePatientData.dislikes);
      if (updatePatientData.symptoms) formData.append("symptoms", updatePatientData.symptoms);

      // Append profile picture if selected
      if (profilePicture) {
        formData.append("profilePicture", profilePicture);
      }

      const response = await fetch(`/api/patient/${selectedPatient.id}`, {
        method: "PATCH",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to update patient");
      }

      mutate();
      setIsUpdateDialogOpen(false);
      setSelectedPatient(null);
      setProfilePicture(null);
      toast.success("Patient updated successfully!");
    } catch (error) {
      toast.error("Failed to update patient.");
      console.error("Failed to update patient:", error);
    }
  };

  // Create patient
  const handleCreatePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const formData = new FormData();
      formData.append("name", newPatientData.name);
      formData.append("email", newPatientData.email);
      formData.append("password", newPatientData.password);
      
      // Append optional fields
      if (newPatientData.about) formData.append("about", newPatientData.about);
      if (newPatientData.age) formData.append("age", newPatientData.age);
      if (newPatientData.sex) formData.append("sex", newPatientData.sex);
      if (newPatientData.dateOfBirth) formData.append("dateOfBirth", newPatientData.dateOfBirth);
      if (newPatientData.location) formData.append("location", newPatientData.location);
      if (newPatientData.education) formData.append("education", newPatientData.education);
      if (newPatientData.work) formData.append("work", newPatientData.work);
      if (newPatientData.fallRisk) formData.append("fallRisk", newPatientData.fallRisk);
      if (newPatientData.likes) formData.append("likes", newPatientData.likes);
      if (newPatientData.dislikes) formData.append("dislikes", newPatientData.dislikes);
      if (newPatientData.symptoms) formData.append("symptoms", newPatientData.symptoms);

      // Append profile picture if selected
      if (profilePicture) {
        formData.append("profilePicture", profilePicture);
      }

      const response = await fetch("/api/patient", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to create patient");
      }

      mutate();
      setIsCreateDialogOpen(false);
      setNewPatientData({
        name: "",
        email: "",
        password: "",
        about: "",
        age: "",
        sex: "",
        dateOfBirth: "",
        location: "",
        education: "",
        work: "",
        fallRisk: "no",
        likes: "",
        dislikes: "",
        symptoms: "",
        profilePicture: null,
      });
      setProfilePicture(null);
      toast.success("Patient created successfully!");
    } catch (error) {
      toast.error("Failed to create patient.");
      console.error("Failed to create patient:", error);
    }
  };

  // Delete patient
  const handleDeletePatient = async (patientId: string) => {
    try {
      const response = await fetch(`/api/patient/${patientId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete patient");
      }

      mutate();
      toast.success("Patient deleted successfully!");
    } catch (error) {
      toast.error("Failed to delete patient.");
      console.error("Failed to delete patient:", error);
    }
  };

  // Filter patients based on search query
  const filteredPatients = patientList?.filter(patient => 
    patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    patient.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Format date
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Loading state
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
          <h1 className="text-2xl sm:text-3xl font-bold">Patient Management</h1>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Patient
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[625px]">
              <form onSubmit={handleCreatePatient}>
                <DialogHeader>
                  <DialogTitle>Create New Patient</DialogTitle>
                  <DialogDescription>
                    Add a new patient to the system.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={newPatientData.name}
                      onChange={(e) => setNewPatientData({...newPatientData, name: e.target.value})}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newPatientData.email}
                      onChange={(e) => setNewPatientData({...newPatientData, email: e.target.value})}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={newPatientData.password}
                      onChange={(e) => setNewPatientData({...newPatientData, password: e.target.value})}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="age">Age</Label>
                    <Input
                      id="age"
                      type="text"
                      value={newPatientData.age}
                      onChange={(e) => setNewPatientData({...newPatientData, age: e.target.value})}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="sex">Sex</Label>
                    <Input
                      id="sex"
                      value={newPatientData.sex}
                      onChange={(e) => setNewPatientData({...newPatientData, sex: e.target.value})}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={newPatientData.location}
                      onChange={(e) => setNewPatientData({...newPatientData, location: e.target.value})}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="fallRisk">Fall Risk</Label>
                    <select
                      id="fallRisk"
                      value={newPatientData.fallRisk}
                      onChange={(e) => setNewPatientData({...newPatientData, fallRisk: e.target.value as 'yes' | 'no'})}
                      className="w-full p-2 border rounded"
                    >
                      <option value="no">No</option>
                      <option value="yes">Yes</option>
                    </select>
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
                  <Button type="submit">Create Patient</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search patients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {filteredPatients?.length === 0 ? (
        <div className="flex h-[40vh] flex-col items-center justify-center gap-4 rounded-lg border border-dashed p-8 text-center">
          <div className="text-xl font-semibold">No patients found</div>
          <p className="text-muted-foreground">
            {searchQuery ? "Try adjusting your search terms." : "No patients have been added yet."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12 sm:w-14">Patient</TableHead>
                <TableHead>Details</TableHead>
                <TableHead className="hidden lg:table-cell">Location</TableHead>
                <TableHead className="w-20">Fall Risk</TableHead>
                <TableHead className="w-14">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPatients?.map((patient) => (
                <TableRow key={patient.id}>
                  <TableCell>
                    <img
                      src={patient.profilePicture || "/default-avatar.png"}
                      alt={patient.name}
                      className="size-8 sm:size-10 rounded-full object-cover"
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{patient.name}</span>
                      <span className="text-sm text-muted-foreground">{patient.email}</span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-muted-foreground">
                    {patient.location || 'N/A'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={patient.fallRisk === 'yes' ? 'destructive' : 'default'}>
                      {patient.fallRisk === 'yes' ? 'High Risk' : 'Low Risk'}
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
                        <DropdownMenuItem onClick={() => handleOpenUpdateDialog(patient)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDeletePatient(patient.id)}
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
        <DialogContent className="sm:max-w-[625px]">
          <form onSubmit={handleUpdatePatient}>
            <DialogHeader>
              <DialogTitle>Update Patient</DialogTitle>
              <DialogDescription>
                Update patient information.
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="update-name">Name</Label>
                <Input
                  id="update-name"
                  value={updatePatientData.name}
                  onChange={(e) => setUpdatePatientData({...updatePatientData, name: e.target.value})}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="update-email">Email</Label>
                <Input
                  id="update-email"
                  type="email"
                  value={updatePatientData.email}
                  onChange={(e) => setUpdatePatientData({...updatePatientData, email: e.target.value})}
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
                  value={updatePatientData.password}
                  onChange={(e) => setUpdatePatientData({...updatePatientData, password: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="update-age">Age</Label>
                <Input
                  id="update-age"
                  value={updatePatientData.age}
                  onChange={(e) => setUpdatePatientData({...updatePatientData, age: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="update-sex">Sex</Label>
                <Input
                  id="update-sex"
                  value={updatePatientData.sex}
                  onChange={(e) => setUpdatePatientData({...updatePatientData, sex: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="update-location">Location</Label>
                <Input
                  id="update-location"
                  value={updatePatientData.location}
                  onChange={(e) => setUpdatePatientData({...updatePatientData, location: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="update-fallRisk">Fall Risk</Label>
                <select
                  id="update-fallRisk"
                  value={updatePatientData.fallRisk}
                  onChange={(e) => setUpdatePatientData({...updatePatientData, fallRisk: e.target.value as 'yes' | 'no'})}
                  className="w-full p-2 border rounded"
                >
                  <option value="no">No</option>
                  <option value="yes">Yes</option>
                </select>
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
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsUpdateDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Update Patient</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}