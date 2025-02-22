import { auth } from "@/app/(auth)/auth";
import { getPatientById, updatePatient } from "@/lib/db/queries";
import { put } from "@vercel/blob";
import * as bcrypt from 'bcrypt-ts';

export async function PUT(request: Request,
  { params }: {
    params: Promise<{ id: string }>
  }) {

  const { id } = await params;
  const session = await auth();
  if (!id) {
    return new Response('Patient not found', { status: 404 });
  }
  if (!session?.user?.id && session?.user.role !== 'moderator') {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const formData = await request.formData();

    const existingPatient = await getPatientById({ id });
    if (!existingPatient) {
      return new Response('Patient not found', { status: 404 });
    }
    // Basic user fields

    const email = (formData.get('email') || existingPatient.email) as string;
    const password = formData.get('password') as string | null;
    const name = (formData.get('name') || existingPatient.name) as string;

    const profilePicture = formData.get('profilePicture') as File | null;


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
      promptAnswers: convertToRecord(formData.get('promptAnswers')),
      likes: formData.get('likes') as string || '',
      dislikes: formData.get('dislikes') as string || '',
      symptoms: formData.get('symptoms') as string || '',
    };

    function convertToRecord(value: FormDataEntryValue | null): Record<string, string> | null {
      if (value === null) {
        return null;
      }

      if (typeof value === 'string') {
        try {
          return JSON.parse(value) as Record<string, string>;
        } catch (error) {
          // If it's not a valid JSON string, return null or handle the error as needed
          console.error("Failed to parse promptAnswers as JSON:", error);
          return null; // Or throw an error, or return a default object
        }
      }

      return null;
    }



    // Handle profile picture upload
    let profilePictureUrl = existingPatient.profilePicture;
    if (profilePicture) {
      const blob = await put(`profiles/${Date.now()}-${profilePicture.name}`, profilePicture, {
        access: 'public',
      });
      profilePictureUrl = blob.url;
    }

    // Handle password update
    let hashedPassword = existingPatient.password;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    // Check if any patient details were provided
    const hasPatientDetails = Object.values(patientDetails).some(value => value !== '');

    // Update user with all fields
    const updatedUser = await updatePatient(id, {
      ...existingPatient,
      email,
      password: hashedPassword,
      name,
      profilePicture: profilePictureUrl,
      ...patientDetails
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

// export async function PATCH(
//     request: Request
// ) {
//     try {
//         const { searchParams } = new URL(request.url);
//         const userId = searchParams.get('userId');
//         const body = await request.json();

//         // Validate the role
//         if (body.role && !['admin', 'moderator', 'user'].includes(body.role)) {
//             return NextResponse.json(
//                 { error: "Invalid role specified" },
//                 { status: 400 }
//             );
//         }

//         const updatedUser = await updateUser({ id: userId, ...body })

//         return NextResponse.json(updatedUser);
//     } catch (error) {
//         console.error("Error updating user:", error);
//         return NextResponse.json(
//             { error: "Failed to update user" },
//             { status: 500 }
//         );
//     }
// }
// export async function DELETE(request: Request) {
//     const session = await auth();

//     if (!session?.user?.id || session.user.role !== 'admin') {
//         return new Response('Unauthorized', { status: 401 });
//     }

//     try {
//         const { searchParams } = new URL(request.url);
//         const id = searchParams.get('id');

//         if (!id) {
//             return new Response('User ID is required', { status: 400 });
//         }

//         // Instead of hard deleting, we'll set isActive to false
//         await updateUser({
//             id,
//             isActive: false,
//             updatedAt: new Date()
//         });

//         return new Response('User deactivated successfully', { status: 200 });
//     } catch (error) {
//         console.error('Failed to delete user:', error);
//         return new Response('Failed to delete user', { status: 500 });
//     }
// }