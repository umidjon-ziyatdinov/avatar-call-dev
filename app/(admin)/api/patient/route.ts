// app/(admin)/api/patient/route.ts
import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import * as bcrypt from 'bcrypt-ts';
import { auth } from '@/app/(auth)/auth';
import { 
  getAllPatients,
  getPatientsByCreator,
  createPatientWithUser,
  searchPatients,
  filterPatients
} from '@/lib/db/patient-user-queries';

// GET /api/patient
export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    
    // Filter parameters
    const location = searchParams.get('location');
    const minAge = searchParams.get('minAge');
    const maxAge = searchParams.get('maxAge');
    const sex = searchParams.get('sex');
    const fallRisk = searchParams.get('fallRisk') as 'yes' | 'no' | null;

    let patients;

    if (search) {
      patients = await searchPatients(search);
    } else if (location || minAge || maxAge || sex || fallRisk) {
      patients = await filterPatients({
        location: location || undefined,
        ageRange: minAge && maxAge ? { min: minAge, max: maxAge } : undefined,
        sex: sex || undefined,
        fallRisk: fallRisk || undefined
      });
    } else {
      // If user is admin or moderator, get all patients, otherwise get only their created patients
      if (session.user.role === 'admin' || session.user.role === 'moderator') {
        patients = await getAllPatients();
      } else {
        patients = await getPatientsByCreator(session.user.id);
      }
    }

    // Remove sensitive information from response
    const sanitizedPatients = patients.map(({ password: _, ...patient }) => patient);
    return NextResponse.json(sanitizedPatients);
  } catch (error) {
    console.error('Error in GET /api/patient:', error);
    return NextResponse.json(
      { error: 'Failed to fetch patients' },
      { status: 500 }
    );
  }
}

// POST /api/patient
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    const formData = await request.formData();

    // Required fields
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const name = formData.get('name') as string;

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Required fields are missing' },
        { status: 400 }
      );
    }

    // Handle profile picture upload
    const profilePicture = formData.get('profilePicture') as File;
    let profilePictureUrl = '';
    if (profilePicture) {
      const blob = await put(`profiles/${Date.now()}-${profilePicture.name}`, profilePicture, {
        access: 'public',
      });
      profilePictureUrl = blob.url;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Handle optional fields
    const about = formData.get('about') as string;
    const age = formData.get('age') as string;
    const sex = formData.get('sex') as string;
    const dateOfBirth = formData.get('dateOfBirth') as string;
    const location = formData.get('location') as string;
    const education = formData.get('education') as string;
    const work = formData.get('work') as string;
    const fallRisk = formData.get('fallRisk') as 'yes' | 'no';
    const likes = formData.get('likes') as string;
    const dislikes = formData.get('dislikes') as string;
    const symptoms = formData.get('symptoms') as string;
    const promptAnswers = formData.get('promptAnswers') 
      ? JSON.parse(formData.get('promptAnswers') as string)
      : {};

    // Create both user and patient records
    const { user: newUser, patient: newPatient } = await createPatientWithUser({
      email,
      password: hashedPassword,
      name,
      profilePicture: profilePictureUrl,
      about: about || '',
      age: age || '',
      sex: sex || '',
      dateOfBirth: dateOfBirth || '',
      location: location || '',
      education: education || '',
      work: work || '',
      fallRisk: fallRisk || 'no',
      promptAnswers,
      likes: likes || '',
      dislikes: dislikes || '',
      symptoms: symptoms || '',
      createdById: session.user.id
    });

    // Remove sensitive information from response
    const { password: _, ...patientWithoutPassword } = newPatient;
    return NextResponse.json(patientWithoutPassword, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/patient:', error);
    return NextResponse.json(
      { error: 'Failed to create patient' },
      { status: 500 }
    );
  }
}