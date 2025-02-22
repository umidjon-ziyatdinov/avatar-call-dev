import { auth } from "@/app/(auth)/auth";
import { createNewCall, getCallByUserAndAvatarId, getModeratorCalls } from "@/lib/db/queries";
import { NextResponse } from "next/server";
import { z } from "zod";


;
export async function GET(request: Request) {
    try {
        // 1. Authenticate user
        const session = await auth();
        if (!session?.user?.id) {
            return new NextResponse(
                JSON.stringify({ error: 'Authentication required' }),
                { status: 401 }
            );
        }

        // 2. Parse and validate query parameters
        const { searchParams } = new URL(request.url);

        const params = {
            avatarId: searchParams.get('avatarId'),
            isAdmin: searchParams.get('isAdmin'),
        }

        const { avatarId, isAdmin } = params;

        // 3. Get call history
        try {

            if (avatarId && (avatarId !== null)) {
                const calls = await getCallByUserAndAvatarId({
                    id: session.user.id,
                    avatarId: avatarId!,
                });
                return NextResponse.json({
                    success: true,
                    data: calls,
                    total: calls.length
                });
            }
            const calls = await getModeratorCalls({ userId: session.user.id });
            return NextResponse.json({
                success: true,
                data: calls,
                total: calls.length
            });

            // 4. Transform and sort calls if needed
            // const processedCalls = calls
            //     .sort((a, b) => new Date(b.technicalDetails?.startTime).getTime() - new Date(a?.technicalDetails?.startTime).getTime())
            //     .map(call => ({
            //         ...call,
            //         duration: call.endTime 
            //             ? new Date(call.endTime).getTime() - new Date(call.startTime).getTime() 
            //             : undefined
            //     }));

            // 5. Return successful response
            return NextResponse.json({
                success: true,
                data: calls,
                total: calls.length
            });

        } catch (dbError) {
            console.error('Database error:', dbError);
            return new NextResponse(
                JSON.stringify({ error: 'Failed to fetch call history' }),
                { status: 500 }
            );
        }

    } catch (error) {
        // Log the full error for debugging
        console.error('Unexpected error in GET /api/calls:', error);

        // Return a safe error response
        return new NextResponse(
            JSON.stringify({
                error: 'An unexpected error occurred',
                message: error instanceof Error ? error.message : 'Unknown error'
            }),
            { status: 500 }
        );
    }
}