// app/api/calls/route.ts

import { auth } from "@/app/(auth)/auth";
import { getAllCallsByModeratorId } from "@/lib/db/call-queries";
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

        // Check if user is a moderator
        if (session.user.role !== 'moderator') {
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