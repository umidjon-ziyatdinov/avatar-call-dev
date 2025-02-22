// app/(admin)/api/super-admin/route.ts
import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import * as bcrypt from 'bcrypt-ts';
import { 
  getAllAdmins, 
  getActiveAdmins, 
  createAdmin, 
  searchAdmins 
} from '@/lib/db/admin-queries';

// GET /api/super-admin
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const activeOnly = searchParams.get('activeOnly') === 'true';

    let admins;
    if (search) {
      admins = await searchAdmins(search);
    } else if (activeOnly) {
      admins = await getActiveAdmins();
    } else {
      admins = await getAllAdmins();
    }

    // Remove passwords from response
    const adminsWithoutPasswords = admins.map(({ password: _, ...admin }) => admin);
    return NextResponse.json(adminsWithoutPasswords);
  } catch (error) {
    console.error('Error in GET /api/super-admin:', error);
    return NextResponse.json(
      { error: 'Failed to fetch admin users' },
      { status: 500 }
    );
  }
}

// POST /api/super-admin
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const name = formData.get('name') as string;
    const passcode = parseInt(formData.get('passcode') as string);
    const profilePicture = formData.get('profilePicture') as File;

    if (!email || !password || !passcode) {
      return NextResponse.json(
        { error: 'Email, password and passcode are required' },
        { status: 400 }
      );
    }

    // Upload profile picture if provided
    let profilePictureUrl = '';
    if (profilePicture) {
      const blob = await put(`admin-profiles/${Date.now()}-${profilePicture.name}`, profilePicture, {
        access: 'public',
      });
      profilePictureUrl = blob.url;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create admin user
    const newAdmin = await createAdmin({
        email,
        password: hashedPassword,
        name: name || 'Unknown',
        passcode,
        profilePicture: profilePictureUrl,
        isActive: true,
        patientDetails: {
            about: '',
            age: '',
            sex: '',
            dateOfBirth: '',
            location: '',
            education: '',
            work: '',
            fallRisk: 'no',
            promptAnswers: {},
            likes: '',
            dislikes: '',
            symptoms: '',
            avatar: ''
        },
        lastLoginAt: null,
        verifiedAt: null
    });

    // Remove password from response
    const { password: _, ...adminWithoutPassword } = newAdmin;
    return NextResponse.json(adminWithoutPassword, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/super-admin:', error);
    return NextResponse.json(
      { error: 'Failed to create admin user' },
      { status: 500 }
    );
  }
}