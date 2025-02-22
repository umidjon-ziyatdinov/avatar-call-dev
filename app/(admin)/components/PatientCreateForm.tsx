import React, { useState } from 'react';
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from '@/components/ui/card';
import Form from 'next/form';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SubmitButton } from '@/components/submit-button';
import useSWR from 'swr';
import { fetcher } from '@/lib/utils';

// Type for prompt
type Prompt = {
  id: string;
  question: string;
};

// Type for prompt answer
type PromptAnswer = {
  promptId: string;
  question: string;
  answer: string;
};

export const PatientCreateDialog = ({ onClose }: { onClose: () => void }) => {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [newImageFile, setNewImageFile] = useState<File | null>(null);
  
  // Fetch available prompts
  const {data: availablePrompts, isLoading} = useSWR<Prompt[]>("/api/prompt/patient", fetcher);
  const [selectedPrompts, setSelectedPrompts] = useState<PromptAnswer[]>([]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePromptSelect = (index: number, promptId: string) => {
    const prompt = availablePrompts?.find(p => p.id === promptId);
    if (!prompt) return;

    setSelectedPrompts(prev => {
      const newPrompts = [...prev];
      while (newPrompts.length <= index) {
        newPrompts.push({ promptId: '', question: '', answer: '' });
      }
      newPrompts[index] = {
        promptId: prompt.id,
        question: prompt.question,
        answer: ''
      };
      return newPrompts;
    });
  };

  const handleAnswerChange = (index: number, answer: string) => {
    setSelectedPrompts(prev => {
      const newPrompts = [...prev];
      if (newPrompts[index]) {
        newPrompts[index] = {
          ...newPrompts[index],
          answer
        };
      }
      return newPrompts;
    });
  };

  async function handleSubmit(formData: FormData) {
    setIsPending(true);
    try {
      if (newImageFile) {
        formData.append('profilePicture', newImageFile);
      }
      formData.append('promptAnswers', JSON.stringify(selectedPrompts));

      const response = await fetch('/api/patient', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Failed to create patient');
      }
      
      toast.success('Patient Created Successfully');
      onClose();
    } catch (error) {
      toast.error('Creation Failed');
      console.error('Error creating patient:', error);
    } finally {
      setIsPending(false);
    }
  }

  return (

      
      <div className="max-w-4xl py-6 w-full">
        <Card className="bg-card border-0 w-full">
          <CardContent className="sm:p-6 p-0 w-full">
            <Form action={handleSubmit} className="flex flex-col space-y-6 w-full">
              {/* Header Section */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                <div className="relative w-32 h-32 rounded-full overflow-hidden bg-muted">
                  {imagePreview ? (
                    <img 
                      src={imagePreview} 
                      alt="Patient" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-muted-foreground">Add Photo</span>
                    </div>
                  )}
                  <input
                    type="file"
                    onChange={handleImageChange}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    accept="image/*"
                  />
                </div>
                
                <div className="flex-1 w-full">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="name">Patient Name</Label>
                    <Input
                      id="name"
                      name="name"
                      required
                      className="text-2xl font-bold"
                    />
                  </div>
                  <div className="flex flex-col gap-2 mt-4">
                    <Label htmlFor="about">About / Fun Fact</Label>
                    <Textarea
                      id="about"
                      name="about"
                      rows={3}
                    />
                  </div>
                </div>
              </div>

              {/* Account Information */}
              <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    required
                  />
                </div>
              </div>

              {/* Basic Information */}
              <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { id: 'age', label: 'Age' },
                  { id: 'sex', label: 'Sex' },
                  { id: 'dateOfBirth', label: 'Date of Birth', type: 'date' },
                  { id: 'location', label: 'Location' },
                  { id: 'education', label: 'Education' },
                  { id: 'work', label: 'Work' }
                ].map(field => (
                  <div key={field.id} className="flex flex-col gap-2">
                    <Label htmlFor={field.id}>{field.label}</Label>
                    <Input
                      id={field.id}
                      name={field.id}
                      type={field.type || 'text'}
                    />
                  </div>
                ))}
              </div>

              {/* Fall Risk */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="fallRisk">Fall Risk</Label>
                <Select name="fallRisk">
                  <SelectTrigger>
                    <SelectValue placeholder="Select fall risk status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Yes</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Prompts */}
              <div className="space-y-6 w-full">
                <h3 className="text-lg font-semibold">Patient Prompts</h3>
                {[0, 1, 2].map((index) => (
                  <div key={index} className="space-y-4 w-full">
                    <div className="flex flex-col gap-2 max-w-full relative w-full [&_.select-trigger]:whitespace-normal [&_.select-trigger]:break-words [&_.select-trigger]:min-h-[60px] [&_.select-content]:break-words [&_.select-content]:whitespace-normal">
                      <Label>Prompt {index + 1}</Label>
                      <Select 
                        onValueChange={(value) => handlePromptSelect(index, value)}
                        value={selectedPrompts[index]?.promptId}
                      >
                        <SelectTrigger className="max-w-full py-2">
                          <SelectValue placeholder={`Select prompt ${index + 1}`} className="max-w-full py-4 h-auto">
                            {selectedPrompts[index] && (
                              <span className="max-w-full py-2 line-clamp-2 whitespace-pre-line break-words text-left">
                                {selectedPrompts[index].question}
                              </span>
                            )}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent className="max-w-[350px] sm:max-w-full w-full line-clamp-2 whitespace-pre-line break-words text-left">
                         {isLoading ? <span>Loading...</span> :  availablePrompts?.map((prompt, idx) => (
                            <SelectItem 
                              key={prompt.id} 
                              className="max-w-full line-clamp-2 whitespace-pre-line break-words text-left"
                              value={prompt.id}
                            >
                              <span className="max-w-full line-clamp-2 whitespace-pre-line break-words text-left min-h-[2.5rem]">
                                {idx + 1}.{' '}{prompt.question}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Textarea
                        value={selectedPrompts[index]?.answer}
                        onChange={(e) => handleAnswerChange(index, e.target.value)}
                        placeholder="Enter your answer..."
                        rows={3}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Preferences and Medical */}
              {[
                { id: 'likes', label: 'Likes' },
                { id: 'dislikes', label: 'Dislikes / Triggers' },
                { id: 'symptoms', label: 'Symptoms / Pain / Complaints' }
              ].map(field => (
                <div key={field.id} className="flex flex-col gap-2">
                  <Label htmlFor={field.id}>{field.label}</Label>
                  <Textarea
                    id={field.id}
                    name={field.id}
                    rows={2}
                  />
                </div>
              ))}

              {/* Submit Button */}
              <SubmitButton
                loadingText="Creating" 
                className="w-full" 
                isLoading={isPending}
              >
                Create Patient
              </SubmitButton>
            </Form>
          </CardContent>
        </Card>
      </div>

  );
};