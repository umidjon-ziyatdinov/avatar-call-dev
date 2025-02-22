// app/api/calls/route.ts

import { auth } from "@/app/(auth)/auth";
import { createNewCall, getAllCalls, getAllCallsForAdmin, getCallByUserAndAvatarId, getModeratorCalls } from "@/lib/db/queries";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    try {
        // 1. Authenticate moderator
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

            if (session.user.role === 'admin') {
                const allCalls = await getAllCallsForAdmin();
                return NextResponse.json({
                    success: true,
                    data: allCalls,
                    total: allCalls.length
                });
            } else {

                const calls = await getModeratorCalls({ userId: session.user.id });
                return NextResponse.json({
                    success: true,
                    data: calls,
                    total: calls.length
                });
            }


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

        } catch (dbError) {
            console.error('Database error:', dbError);
            return new NextResponse(
                JSON.stringify({ error: 'Unauthorized. Moderator access required.' }),
                { status: 403 }
            );
        }

        // 2. Get calls for all patients of this moderator
        const calls = await getAllCallsByModeratorId(session.user.id);
        
        return NextResponse.json({
            success: true,
            data: calls,
            total: calls.length
        });

    } catch (error) {
        console.error('Unexpected error in GET /api/calls:', error);
        return new NextResponse(
            JSON.stringify({
                error: 'An unexpected error occurred',
                message: error instanceof Error ? error.message : 'Unknown error'
            }),
            { status: 500 }
        );
    }
}