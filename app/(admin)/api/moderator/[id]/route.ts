// @ts-nocheck
// app/(admin)/api/moderator/[id]/route.ts
import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import * as bcrypt from 'bcrypt-ts';
import {
  getModeratorById,
  updateModerator,
  deleteModerator,
  toggleModeratorStatus
} from '@/lib/db/moderator-queries';

interface RouteParams {
  params: {
    id: string;
  };
}

// GET /api/moderator/[id]
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const moderator = await getModeratorById(params.id);
    if (!moderator) {
      return NextResponse.json(
        { error: 'Moderator not found' },
        { status: 404 }
      );
    }

    // Remove password from response
    const { password: _, ...moderatorWithoutPassword } = moderator;
    return NextResponse.json(moderatorWithoutPassword);
  } catch (error) {
    console.error('Error in GET /api/moderator/[id]:', error);
    return NextResponse.json(
      { error: 'Failed to fetch moderator user' },
      { status: 500 }
    );
  }
}

// PATCH /api/moderator/[id]
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const formData = await request.formData();

    // Handle status toggle
    const isActive = formData.get('isActive');
    if (isActive !== null) {
      const updatedModerator = await toggleModeratorStatus(params.id, isActive === 'true');
      const { password: _, ...moderatorWithoutPassword } = updatedModerator;
      return NextResponse.json(moderatorWithoutPassword);
    }

    // Handle file upload if new profile picture is provided
    const profilePicture = formData.get('profilePicture') as File;
    let profilePictureUrl;
    if (profilePicture) {
      const blob = await put(`moderator-profiles/${Date.now()}-${profilePicture.name}`, profilePicture, {
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

    // Update moderator
    const updateData: any = {
      email: formData.get('email') as string,
      name: formData.get('name') as string,
      passcode: formData.get('passcode') ? parseInt(formData.get('passcode') as string) : undefined,
      updatedAt: new Date(),
    };

    // Only add password and profile picture if they were provided
    if (hashedPassword) {
      updateData.password = hashedPassword;
    }
    if (profilePictureUrl) {
      updateData.profilePicture = profilePictureUrl;
    }

    const updatedModerator = await updateModerator(params.id, updateData);
    if (!updatedModerator) {
      return NextResponse.json(
        { error: 'Moderator not found' },
        { status: 404 }
      );
    }

    // Remove password from response
    const { password: _, ...moderatorWithoutPassword } = updatedModerator;
    return NextResponse.json(moderatorWithoutPassword);
  } catch (error) {
    console.error('Error in PATCH /api/moderator/[id]:', error);
    return NextResponse.json(
      { error: 'Failed to update moderator user' },
      { status: 500 }
    );
  }
}

// DELETE /api/moderator/[id]
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const deletedModerator = await deleteModerator(params.id);
    if (!deletedModerator) {
      return NextResponse.json(
        { error: 'Moderator not found' },
        { status: 404 }
      );
    }

    // Remove password from response
    const { password: _, ...moderatorWithoutPassword } = deletedModerator;
    return NextResponse.json(moderatorWithoutPassword);
  } catch (error) {
    console.error('Error in DELETE /api/moderator/[id]:', error);
    return NextResponse.json(
      { error: 'Failed to delete moderator user' },
      { status: 500 }
    );
  }
}