// @ts-nocheck
import { put } from '@vercel/blob';
import { auth } from '@/app/(auth)/auth';
import {
    deleteAvatarById,
    getAvatarById,
    createAvatar,
    updateAvatar,
    getAllAvatars
} from '@/lib/db/queries';
import { Avatar, avatar } from '@/lib/db/schema';
import { NextResponse } from 'next/server';
import { createAvatarSchema } from '@/types/avatarValidation';
import { z } from 'zod';

interface GenerateCharacterResult {
    simliStatus: "success" | "error";
    simliCharacterId: string | null;
    warnings?: string[];
    error?: string;
}
interface SimliResponse {
    message: string;
    character_uid: string;
    warnings?: string[];
    error?: string;
}


async function generateCharacter({ name, image }: { name: string; image: File }): Promise<GenerateCharacterResult> {
    try {
        const formData = new FormData();
        formData.append("image", image);

        // Track request start
        console.log(`[Simli] Starting face generation for ${name}`, {
            timestamp: new Date().toISOString(),
            fileSize: image.size,
            fileType: image.type
        });

        const response = await fetch(`https://api.simli.ai/generateFaceID?face_name=${name}`, {
            method: "POST",
            headers: {
                'api-key': process.env.NEXT_PUBLIC_SIMLI_API_KEY,
                // Remove Content-Type header - let it be set automatically
            },
            body: formData,
        });

        const simliResult = await response.json() as SimliResponse;

        // Track API response
        console.log(`[Simli] Received response for ${name}`, {
            timestamp: new Date().toISOString(),
            status: response.status,
            response: simliResult
        });

        if (!response.ok) {
            console.error("[Simli] API error:", {
                status: response.status,
                error: simliResult.error || simliResult?.detail,  // Include detail field in error logging
                name
            });
            return {
                simliStatus: "error",
                simliCharacterId: null,
                error: simliResult.error || simliResult.detail || "Failed to generate character"
            };
        }

        // Handle successful response with warnings
        if (simliResult.warnings?.length) {
            console.warn("[Simli] Generation warnings:", {
                name,
                warnings: simliResult.warnings,
                characterUid: simliResult.character_uid
            });
        }

        return {
            simliStatus: "success",
            simliCharacterId: simliResult.character_uid,
            warnings: simliResult.warnings
        };
    } catch (error) {
        console.error("[Simli] Error in generateCharacter:", {
            error,
            name,
            timestamp: new Date().toISOString()
        });
        return {
            simliStatus: "error",
            simliCharacterId: null,
            error: error instanceof Error ? error.message : "Unknown error occurred"
        };
    }
}
export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Authentication required." },
                { status: 401 }
            );
        }
        const formData = await request.formData();
        const avatarFile = formData.get("avatarFile") as File | null;

        // Validate file existence and type
        if (!avatarFile || !avatarFile.type.startsWith("image/")) {
            return NextResponse.json(
                { error: "Invalid or missing image file." },
                { status: 400 }
            );
        }

        // Validate file size
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (avatarFile.size > maxSize) {
            return NextResponse.json(
                { error: "File size too large. Maximum is 5MB." },
                { status: 400 }
            );
        }

        // Upload file to storage
        const blob = await put(`${formData.get("name")} - ${Date.now()}`, avatarFile, {
            access: "public",
            addRandomSuffix: true,
        });
        const avatarUrl = blob.url;

        // Parse and validate personality data
        const parsedData = Object.fromEntries(formData.entries());
        if (parsedData.personality) {
            try {
                parsedData.personality = JSON.parse(parsedData.personality);
            } catch {
                return NextResponse.json(
                    { error: "Invalid personality JSON." },
                    { status: 400 }
                );
            }
        }

        const data = {
            ...parsedData,
            avatarImage: avatarUrl,
        };

        // Validate data against schema
        const validatedData = createAvatarSchema.parse(data);

        // Check authentication


        // Generate face ID
        const simliResponse = await generateCharacter
            ({
                name: validatedData.name,
                image: avatarFile
            });

        // Handle Simli API failures
        if (simliResponse.simliStatus === "error") {
            return NextResponse.json({
                error: "Failed to generate character face",
                details: simliResponse.error,
                status: "error"
            }, { status: 400 });
        }
        const { searchParams } = new URL(req.url);
        const isPublic = searchParams.get('public');
        // Create avatar only if face generation was successful
        const newAvatar = await createAvatar({
            ...validatedData,
            simliFaceId: null,
            simliCharacterId: simliResponse.simliCharacterId,
            userId: isPublic ? null : session.user.id,
        });

        // Prepare response with detailed information
        const response = {
            status: "success",
            avatar: newAvatar,
            simli: {
                characterId: simliResponse.simliCharacterId,
                warnings: simliResponse.warnings,
                status: "processing"
            },
            message: `Avatar created successfully! The character_uid (${simliResponse.simliCharacterId}) has been assigned to your avatar. This ID is important as it will be used to:
1. Track the face generation progress
2. Link the generated face to your avatar
3. Enable future face-related features

The face generation has been queued and will be processed shortly. You can:
- Use this avatar immediately with a default face
- Wait for the face generation to complete (typically takes 1-2 minutes)
- Check the face generation status using the character_uid
`,
            nextSteps: [
                "You can start using your avatar immediately with default settings",
                "The custom face will be automatically updated once generation is complete",
                "Keep the character_uid for reference if needed"
            ]
        };

        return NextResponse.json(response, { status: 201 });

    } catch (error) {
        // Handle validation errors
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                {
                    error: "Invalid request data",
                    details: error.errors,
                    status: "error"
                },
                { status: 400 }
            );
        }

        // Handle unexpected errors
        console.error("POST /api/avatars error:", error);
        return NextResponse.json(
            {
                error: "Internal Server Error",
                status: "error"
            },
            { status: 500 }
        );
    }
}

export async function GET(request: Request) {
    const session = await auth();

    if (!session || !session.user) {
        return new Response('Unauthorized', { status: 401 });
    }

    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (id) {
            const avatar = await getAvatarById({ id });
            if (!avatar) {
                return new Response('Avatar not found', { status: 404 });
            }
            return new Response(JSON.stringify(avatar), {
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const avatars = await getAllAvatars();
        return new Response(JSON.stringify(avatars), {
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('Failed to fetch avatars:', error);
        return new Response('Failed to fetch avatars', { status: 500 });
    }
}

// API: PUT endpoint modification
export async function PUT(request: Request) {
    const session = await auth();

    if (!session || !session.user) {
        return new Response('Unauthorized', { status: 401 });
    }

    try {
        const formData = await request.formData();
        const id = formData.get('id') as string;
        const name = formData.get('name') as string;
        const role = formData.get('role') as string;
        const avatarFile = formData.get('avatar');
        const avatarUrl = formData.get('avatarUrl') as string | null;
        const openaiVoice = formData.get('openaiVoice') as Avatar['openaiVoice'];
        const openaiModel = formData.get('openaiModel') as Avatar['openaiModel'];
        const simliFaceId = formData.get('simliFaceId') as string;
        const initialPrompt = formData.get('initialPrompt') as string;

        const existingAvatar = await getAvatarById({ id });
        if (!existingAvatar) {
            return new Response('Avatar not found', { status: 404 });
        }

        let finalAvatarUrl = existingAvatar.avatar;

        // Check if a new file was uploaded by checking if avatarFile exists and has a size
        if (avatarFile) {
            const blob = await put(`avatars/${Date.now()}-${(avatarFile as File).name}`, avatarFile as File, {
                access: 'public',
            });
            finalAvatarUrl = blob.url;
        } else if (avatarUrl) {
            // Use the provided URL if no new file was uploaded
            finalAvatarUrl = avatarUrl;
        }

        const updatedAvatar = await updateAvatar({
            id,
            name,
            role,
            avatar: finalAvatarUrl,
            openaiVoice,
            openaiModel,
            simliFaceId,
            initialPrompt
        });

        return new Response(JSON.stringify(updatedAvatar), {
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('Failed to update avatar:', error);
        return new Response('Failed to update avatar', { status: 500 });
    }
}
export async function DELETE(request: Request) {
    const session = await auth();

    if (!session || !session.user) {
        return new Response('Unauthorized', { status: 401 });
    }

    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return new Response('Avatar ID is required', { status: 400 });
        }

        await deleteAvatarById({ id });
        return new Response('Avatar deleted successfully', { status: 200 });
    } catch (error) {
        console.error('Failed to delete avatar:', error);
        return new Response('Failed to delete avatar', { status: 500 });
    }
}