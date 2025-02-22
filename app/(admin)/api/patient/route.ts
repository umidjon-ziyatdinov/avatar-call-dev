
import { put } from '@vercel/blob';
import { auth } from '@/app/(auth)/auth';
import {
  deleteUserById,
  getUserById,
  createUser,
  updateUser,
  getAllUsers,
  createPatient,
  getPatientById,
  getAllPAtients
} from '@/lib/db/queries';
import { User, user } from '@/lib/db/schema';
import * as bcrypt from 'bcrypt-ts';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user && !session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }
  if (session?.user.role !== 'moderator') {
    return new Response('Unauthorized', { status: 403 });
  }

  try {
    const formData = await request.formData();
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const name = formData.get('name') as string;

    const profilePicture = formData.get('profilePicture') as File;

    if (!email || !password) {
      return new Response('Email and password are required', { status: 400 });
    }

    let profilePictureUrl = '';
    if (profilePicture) {
      const blob = await put(`profiles/${Date.now()}-${profilePicture.name}`, profilePicture, {
        access: 'public',
      });
      profilePictureUrl = blob.url;
    }
    const patientDetails = {
      about: formData.get('about') as string || '',
      age: formData.get('age') as string || '',
      sex: formData.get('sex') as string || '',
      dateOfBirth: formData.get('dateOfBirth') as string || '',
      location: formData.get('location') as string || '',
      education: formData.get('education') as string || '',
      work: formData.get('work') as string || '',
      fallRisk: (formData.get('fallRisk') as string || 'no') as 'yes' | 'no',
      promptAnswers: JSON.parse(formData.get('promptAnswers') as string),
      likes: formData.get('likes') as string || '',
      dislikes: formData.get('dislikes') as string || '',
      symptoms: formData.get('symptoms') as string || '',
      avatar: formData.get('avatar') as string || '',

    };
    // Hash password before storing
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await createPatient({
      userId: session.user.id ?? 'defaultUserId',
      email,
      password: hashedPassword,
      name: name || 'Unknown',
      profilePicture: profilePictureUrl,
      ...patientDetails

    });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = newUser;

    return new Response(JSON.stringify(userWithoutPassword), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Failed to create user:', error);
    return new Response('Failed to create user', { status: 500 });
  }
}

export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      const patient = await getPatientById({ id });
      if (!patient) {
        return new Response('User not found', { status: 404 });
      }
      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;
      return new Response(JSON.stringify(userWithoutPassword), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Only admins can get all users
    if (!session.user) {
      return new Response('Unauthorized', { status: 401 });
    }

    const users = await getAllPAtients(session.user.id);
    // Remove passwords from response
    const usersWithoutPasswords = users.map(({ password: _, ...user }) => user);

    return new Response(JSON.stringify(usersWithoutPasswords), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Failed to fetch users:', error);
    return new Response('Failed to fetch users', { status: 500 });
  }
}

