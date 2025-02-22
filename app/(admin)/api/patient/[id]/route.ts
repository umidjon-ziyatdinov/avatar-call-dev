// app/(admin)/api/patient/[id]/route.ts
import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import * as bcrypt from 'bcrypt-ts';
import { auth } from '@/app/(auth)/auth';
import { 
  getPatientById,
  updatePatientAndUser,
  deletePatientAndUser
} from '@/lib/db/patient-user-queries';

interface RouteParams {
  params: {
    id: string;
  };
}

// GET /api/patient/[id]
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    const patient = await getPatientById(params.id);
    if (!patient) {
      return NextResponse.json(
        { error: 'Patient not found' },
        { status: 404 }
      );
    }

    // Check if user has access to this patient
    if (session.user.role !== 'admin' && session.user.role !== 'moderator' && 
        patient.userId !== session.user.id) {
      return new Response('Unauthorized', { status: 403 });
    }

    // Remove password from response
    const { password: _, ...patientWithoutPassword } = patient;
    return NextResponse.json(patientWithoutPassword);
  } catch (error) {
    console.error('Error in GET /api/patient/[id]:', error);
    return NextResponse.json(
      { error: 'Failed to fetch patient' },
      { status: 500 }
    );
  }
}

// PATCH /api/patient/[id]
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Check if patient exists and user has access
    const existingPatient = await getPatientById(params.id);
    if (!existingPatient) {
      return NextResponse.json(
        { error: 'Patient not found' },
        { status: 404 }
      );
    }

    if (session.user.role !== 'admin' && session.user.role !== 'moderator' && 
        existingPatient.userId !== session.user.id) {
      return new Response('Unauthorized', { status: 403 });
    }

    const formData = await request.formData();

    // Handle file upload if new profile picture is provided
    const profilePicture = formData.get('profilePicture') as File;
    let profilePictureUrl;
    if (profilePicture) {
      const blob = await put(`profiles/${Date.now()}-${profilePicture.name}`, profilePicture, {
        access: 'public',
      });
      profilePictureUrl = blob.url;
    }

    // Handle password update
    const password = formData.get('password') as string;
    let hashedPassword;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    // Get all fields
    const updateData = {
      email: formData.get('email') as string,
      name: formData.get('name') as string,
      password: hashedPassword,
      profilePicture: profilePictureUrl,
      about: formData.get('about') as string,
      age: formData.get('age') as string,
      sex: formData.get('sex') as string,
      dateOfBirth: formData.get('dateOfBirth') as string,
      location: formData.get('location') as string,
      education: formData.get('education') as string,
      work: formData.get('work') as string,
      fallRisk: formData.get('fallRisk') as 'yes' | 'no',
      likes: formData.get('likes') as string,
      dislikes: formData.get('dislikes') as string,
      symptoms: formData.get('symptoms') as string,
      promptAnswers: formData.get('promptAnswers') 
        ? JSON.parse(formData.get('promptAnswers') as string)
        : undefined
    };

    // Remove undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key as keyof typeof updateData] === null || 
          updateData[key as keyof typeof updateData] === undefined) {
        delete updateData[key as keyof typeof updateData];
      }
    });

    const updatedPatient = await updatePatientAndUser(params.id, updateData);
    if (!updatedPatient) {
      return NextResponse.json(
        { error: 'Failed to update patient' },
        { status: 500 }
      );
    }

    // Remove password from response
    const { password: _, ...patientWithoutPassword } = updatedPatient;
    return NextResponse.json(patientWithoutPassword);
  } catch (error) {
    console.error('Error in PATCH /api/patient/[id]:', error);
    return NextResponse.json(
      { error: 'Failed to update patient' },
      { status: 500 }
    );
  }
}

// DELETE /api/patient/[id]
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Check if patient exists and user has access
    const existingPatient = await getPatientById(params.id);
    if (!existingPatient) {
      return NextResponse.json(
        { error: 'Patient not found' },
        { status: 404 }
      );
    }

    if (session.user.role !== 'admin' && session.user.role !== 'moderator' && 
        existingPatient.userId !== session.user.id) {
      return new Response('Unauthorized', { status: 403 });
    }

    const deletedPatient = await deletePatientAndUser(params.id);
    if (!deletedPatient) {
      return NextResponse.json(
        { error: 'Failed to delete patient' },
        { status: 500 }
      );
    }

    // Remove password from response
    const { password: _, ...patientWithoutPassword } = deletedPatient;
    return NextResponse.json(patientWithoutPassword);
  } catch (error) {
    console.error('Error in DELETE /api/patient/[id]:', error);
    return NextResponse.json(
      { error: 'Failed to delete patient' },
      { status: 500 }
    );
  }
}