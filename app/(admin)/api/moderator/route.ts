// app/(admin)/api/moderator/route.ts
import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import * as bcrypt from 'bcrypt-ts';
import { 
  getAllModerators, 
  getActiveModerators, 
  createModerator, 
  searchModerators 
} from '@/lib/db/moderator-queries';

// GET /api/moderator
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const activeOnly = searchParams.get('activeOnly') === 'true';

    let moderators;
    if (search) {
      moderators = await searchModerators(search);
    } else if (activeOnly) {
      moderators = await getActiveModerators();
    } else {
      moderators = await getAllModerators();
    }

    // Remove passwords from response
    const moderatorsWithoutPasswords = moderators.map(({ password: _, ...moderator }) => moderator);
    return NextResponse.json(moderatorsWithoutPasswords);
  } catch (error) {
    console.error('Error in GET /api/moderator:', error);
    return NextResponse.json(
      { error: 'Failed to fetch moderator users' },
      { status: 500 }
    );
  }
}

// POST /api/moderator
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
      const blob = await put(`moderator-profiles/${Date.now()}-${profilePicture.name}`, profilePicture, {
        access: 'public',
      });
      profilePictureUrl = blob.url;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create moderator user
    const newModerator = await createModerator({
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
    const { password: _, ...moderatorWithoutPassword } = newModerator;
    return NextResponse.json(moderatorWithoutPassword, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/moderator:', error);
    return NextResponse.json(
      { error: 'Failed to create moderator user' },
      { status: 500 }
    );
  }
}