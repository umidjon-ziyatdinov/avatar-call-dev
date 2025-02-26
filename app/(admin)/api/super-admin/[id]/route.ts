// app/(admin)/api/super-admin/[id]/route.ts
import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import * as bcrypt from 'bcrypt-ts';
import {
  getAdminById,
  updateAdmin,
  deleteAdmin,
  toggleAdminStatus
} from '@/lib/db/admin-queries';

interface RouteParams {
  params: {
    id: string;
  };
}

// GET /api/super-admin/[id]
export async function GET(request: Request, { params }: {
  params: Promise<{ id: string }>
}
) {
  try {
    const { id } = await params;
    const admin = await getAdminById(id);
    if (!admin) {
      return NextResponse.json(
        { error: 'Admin not found' },
        { status: 404 }
      );
    }

    // Remove password from response
    const { password: _, ...adminWithoutPassword } = admin;
    return NextResponse.json(adminWithoutPassword);
  } catch (error) {
    console.error('Error in GET /api/super-admin/[id]:', error);
    return NextResponse.json(
      { error: 'Failed to fetch admin user' },
      { status: 500 }
    );
  }
}

// PATCH /api/super-admin/[id]
export async function PATCH(request: Request, { params }: {
  params: Promise<{ id: string }>
}
) {
  try {
    const { id } = await params;
    const formData = await request.formData();

    // Handle status toggle
    const isActive = formData.get('isActive');
    if (isActive !== null) {
      const updatedAdmin = await toggleAdminStatus(id, isActive === 'true');
      const { password: _, ...adminWithoutPassword } = updatedAdmin;
      return NextResponse.json(adminWithoutPassword);
    }

    // Handle file upload if new profile picture is provided
    const profilePicture = formData.get('profilePicture') as File;
    let profilePictureUrl;
    if (profilePicture) {
      const blob = await put(`admin-profiles/${Date.now()}-${profilePicture.name}`, profilePicture, {
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

    // Update admin
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

    const updatedAdmin = await updateAdmin(id, updateData);
    if (!updatedAdmin) {
      return NextResponse.json(
        { error: 'Admin not found' },
        { status: 404 }
      );
    }

    // Remove password from response
    const { password: _, ...adminWithoutPassword } = updatedAdmin;
    return NextResponse.json(adminWithoutPassword);
  } catch (error) {
    console.error('Error in PATCH /api/super-admin/[id]:', error);
    return NextResponse.json(
      { error: 'Failed to update admin user' },
      { status: 500 }
    );
  }
}

// DELETE /api/super-admin/[id]
export async function DELETE(request: Request, { params }: {
  params: Promise<{ id: string }>
}) {
  try {
    const { id } = await params;
    const deletedAdmin = await deleteAdmin(id);
    if (!deletedAdmin) {
      return NextResponse.json(
        { error: 'Admin not found' },
        { status: 404 }
      );
    }

    // Remove password from response
    const { password: _, ...adminWithoutPassword } = deletedAdmin;
    return NextResponse.json(adminWithoutPassword);
  } catch (error) {
    console.error('Error in DELETE /api/super-admin/[id]:', error);
    return NextResponse.json(
      { error: 'Failed to delete admin user' },
      { status: 500 }
    );
  }
}