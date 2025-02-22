"use client";
import { useState } from 'react';
import { useTheme } from 'next-themes';
import useSWR, { mutate } from 'swr';
import { Plus, Pencil } from 'lucide-react';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Patient } from '@/lib/db/schema';
import { PatientEditDialog } from '../components/PatientsEditDialog';
import { PatientCreateDialog } from '../components/PatientCreateForm';
import { fetcher } from '@/lib/utils';
import PatientCard from './PatientCard';




export default function PatientListPage() {
  const { theme } = useTheme();
  const { data: patients, error, isLoading, mutate } = useSWR<Patient[]>('/api/patient', fetcher);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);

  if (error) return <div className="p-4">Failed to load patients</div>;
  if (isLoading) {
    return (
      <div className="flex flex-col w-full h-[50vh] items-center justify-center space-y-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <h2>Loading....</h2>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Patients</h1>
        <Dialog open={isCreateDialogOpen} onOpenChange={(open) =>{
        if(!open)setIsCreateDialogOpen(false);
        mutate() 
      }}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2" onClick={() =>setIsCreateDialogOpen(true)}>
              <Plus size={20} />
              Add Patient
            </Button>
          </DialogTrigger>
          <DialogContent className="  w-full h-svh md:max-w-[1000px] sm:max-w-[90vw] sm:h-[90vh]  overflow-y-auto">
            <DialogHeader className=''>
              <DialogTitle>Create New Patient</DialogTitle>
            </DialogHeader>

            <PatientCreateDialog onClose={() =>{setIsCreateDialogOpen(false); mutate()}} />
          
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" >
        {patients?.map((patient) => (
            <div key={patient.id} onClick={() => {
                setSelectedPatient(patient);
                setIsUpdateDialogOpen(true)
                
              }}> 
                   <PatientCard patient={patient}  />
                </div>
     
        ))}
      </div>
 {selectedPatient &&     <Dialog open={ isUpdateDialogOpen} onOpenChange={(open) =>{
        if(open){setIsUpdateDialogOpen(false); setSelectedPatient(null)};
        mutate() 
      }}>
          
          <DialogContent className="  w-full h-svh md:max-w-[1000px] sm:max-w-[90vw] sm:h-[90vh]  overflow-y-auto">
            <DialogHeader className=''>
              <DialogTitle>Update  Patient</DialogTitle>
            </DialogHeader>

            <PatientEditDialog patient={selectedPatient} onClose={() =>{setIsUpdateDialogOpen(false); setSelectedPatient(null); mutate()}} />
          
          </DialogContent>
        </Dialog>}
    </div>
  );
}