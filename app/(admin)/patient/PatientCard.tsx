import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, Copy, Check } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Patient } from '@/lib/db/schema';
import Image from 'next/image';

const PatientCard = ({patient}: {patient: Patient}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [copyEmailStatus, setCopyEmailStatus] = useState(false);
  const [copyPasswordStatus, setCopyPasswordStatus] = useState(false);

 
  const handleCopy = async (text:string, type: 'email' | 'password') => {
    await navigator.clipboard.writeText(text);
    if (type === 'email') {
      setCopyEmailStatus(true);
      setTimeout(() => setCopyEmailStatus(false), 2000);
    } else {
      setCopyPasswordStatus(true);
      setTimeout(() => setCopyPasswordStatus(false), 2000);
    }
  };

  return ( <TooltipProvider key={patient?.id}>
      <Card className="max-w-lg mx-auto bg-white shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-start gap-6">
            <div className="flex-shrink-0">
              <Image
                src={patient.profilePicture || "/avatar-placeholder.png"}
                alt={patient.name}
                className="rounded-lg object-cover"
                width={128}
                height={128}
              />
          
            </div>

            {/* Patient Info */}
            <div className="flex-grow">
              <h2 className="text-2xl font-semibold capitalize mb-2">{patient.name}</h2>
              
              <div className="space-y-2">
                <p className="text-sm">
                  <span className="font-medium text-gray-500">Age:</span>{' '}
                  {patient.age} years ({patient.sex})
                </p>
                <p className="text-sm">
                  <span className="font-medium text-gray-500">DOB:</span>{' '}
                  {patient.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString() : 'N/A'}
                </p>

                {/* Email with copy button */}
                <div className="flex items-center gap-2">
                  <p className="text-sm">
                    <span className="font-medium text-gray-500">Email:</span>{' '}
                    {patient.email}
                  </p>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleCopy(patient.email, 'email')}
                      >
                        {copyEmailStatus ? <Check size={14} /> : <Copy size={14} />}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Copy email</p>
                    </TooltipContent>
                  </Tooltip>
                </div>

                {/* Password with toggle and copy */}
                <div className="flex items-center gap-2">
                  <p className="text-sm">
                    <span className="font-medium text-gray-500">Password:</span>{' '}
                    {showPassword ? patient.password : '••••••••'}
                  </p>
                  <div className="flex gap-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{showPassword ? 'Hide' : 'Show'} password</p>
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleCopy(patient?.password || '', 'password')}
                        >
                          {copyPasswordStatus ? <Check size={14} /> : <Copy size={14} />}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Copy password</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};

export default PatientCard;