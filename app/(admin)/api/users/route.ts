// @ts-nocheck
import { put } from '@vercel/blob';
import { auth } from '@/app/(auth)/auth';
import {
    deleteUserById,
    getUserById,
    createUser,
    updateUser,
    getAllUsers
} from '@/lib/db/queries';
import { User, user } from '@/lib/db/schema';
import * as bcrypt from 'bcrypt-ts';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    const session = await auth();

    if (!session?.user && !session?.user?.id) {
        return new Response('Unauthorized', { status: 401 });
    }

    try {
        const formData = await request.formData();
        const email = formData.get('email') as string;
        const password = formData.get('password') as string;
        const passcode = formData.get('passcode') as int;
        const name = formData.get('name') as string;
        const role = formData.get('role') as User['role'];
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

        // Hash password before storing
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await createUser({
            email,
            password: hashedPassword,
            passcode: passcode,
            name: name || 'Unknown',
            role: role || 'user',
            profilePicture: profilePictureUrl,
            isActive: true
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
            const user = await getUserById({ id });
            if (!user) {
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

        const users = await getAllUsers();
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

export async function PUT(request: Request) {
    const session = await auth();
    if (!session?.user?.id) {
        return new Response('Unauthorized', { status: 401 });
    }

    try {
        const formData = await request.formData();
        const id = formData.get('id') as string;
        const existingUser = await getUserById({ id });
        if (!existingUser) {
            return new Response('User not found', { status: 404 });
        }
        // Basic user fields

        const email = formData.get('email') || existingUser.email as string;
        const password = formData.get('password') || existingUser.password as string | null;
        const name = formData.get('name') || existingUser.password as string;
        const role = formData.get('role') || existingUser.role as User['role'];
        const profilePicture = formData.get('profilePicture') as File | null;
        const isActive = formData.get('isActive');

        // Patient details fields
        const patientDetails = {
            about: formData.get('about') as string || '',
            age: formData.get('age') as string || '',
            sex: formData.get('sex') as string || '',
            dateOfBirth: formData.get('dateOfBirth') as string || '',
            location: formData.get('location') as string || '',
            education: formData.get('education') as string || '',
            work: formData.get('work') as string || '',
            fallRisk: (formData.get('fallRisk') as string || 'no') as 'yes' | 'no',
            promptAnswers: formData.get('promptAnswers'),
            likes: formData.get('likes') as string || '',
            dislikes: formData.get('dislikes') as string || '',
            symptoms: formData.get('symptoms') as string || '',
            avatar: formData.get('avatar') as string || ''
        };

        // Users can only update their own profile unless they're admin
        if (id !== session.user.id && session.user.role !== 'admin') {
            return new Response('Unauthorized', { status: 401 });
        }




        // Handle profile picture upload
        let profilePictureUrl = existingUser.profilePicture;
        if (profilePicture) {
            const blob = await put(`profiles/${Date.now()}-${profilePicture.name}`, profilePicture, {
                access: 'public',
            });
            profilePictureUrl = blob.url;
        }

        // Handle password update
        let hashedPassword = existingUser.password;
        if (password) {
            hashedPassword = await bcrypt.hash(password, 10);
        }

        // Check if any patient details were provided
        const hasPatientDetails = Object.values(patientDetails).some(value => value !== '');

        // Update user with all fields
        const updatedUser = await updateUser({
            ...existingUser,
            id,
            email,
            password: hashedPassword,
            name,
            role: session.user.role === 'admin' ? role : existingUser.role, // Only admins can change roles
            profilePicture: profilePictureUrl,
            isActive: isActive || existingUser.isActive,
            updatedAt: new Date(),
            patientDetails: hasPatientDetails ? patientDetails : null // Only include if details were provided
        });

        // Remove password from response
        const { password: _, ...userWithoutPassword } = updatedUser;
        return new Response(JSON.stringify(userWithoutPassword), {
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('Failed to update user:', error);
        return new Response('Failed to update user', { status: 500 });
    }
}

export async function PATCH(
    request: Request
) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');
        const body = await request.json();

        // Validate the role
        if (body.role && !['admin', 'moderator', 'user'].includes(body.role)) {
            return NextResponse.json(
                { error: "Invalid role specified" },
                { status: 400 }
            );
        }

        const updatedUser = await updateUser({ id: userId, ...body })

        return NextResponse.json(updatedUser);
    } catch (error) {
        console.error("Error updating user:", error);
        return NextResponse.json(
            { error: "Failed to update user" },
            { status: 500 }
        );
    }
}
export async function DELETE(request: Request) {
    const session = await auth();

    if (!session?.user?.id || session.user.role !== 'admin') {
        return new Response('Unauthorized', { status: 401 });
    }

    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return new Response('User ID is required', { status: 400 });
        }

        // Instead of hard deleting, we'll set isActive to false
        await updateUser({
            id,
            isActive: false,
            updatedAt: new Date()
        });

        return new Response('User deactivated successfully', { status: 200 });
    } catch (error) {
        console.error('Failed to delete user:', error);
        return new Response('Failed to delete user', { status: 500 });
    }
}