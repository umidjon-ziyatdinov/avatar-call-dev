// app/api/calls/search/route.ts

import { NextResponse } from 'next/server';
import { getFilteredModeratorCalls } from '@/lib/db/call-queries';
import { auth } from '@/app/(auth)/auth';
import { z } from 'zod';

const searchParamsSchema = z.object({
    userId: z.string().optional(),
    avatarId: z.string().optional(),
    status: z.enum(['active', 'completed', 'failed', 'missed']).optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    duration: z.number().positive().optional(),
    search: z.string().optional(),
});

export async function POST(request: Request) {
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

        const body = await request.json();
        const validatedParams = searchParamsSchema.safeParse(body);

        if (!validatedParams.success) {
            return NextResponse.json(
                { error: 'Invalid parameters', details: validatedParams.error.errors },
                { status: 400 }
            );
        }

        const filters = {
            ...validatedParams.data,
            startDate: validatedParams.data.startDate
                ? new Date(validatedParams.data.startDate)
                : undefined,
            endDate: validatedParams.data.endDate
                ? new Date(validatedParams.data.endDate)
                : undefined,
        };

        // Get filtered calls for moderator's patients
        const calls = await getFilteredModeratorCalls(session.user.id, filters);

        return NextResponse.json({
            status: 'success',
            data: calls,
            metadata: {
                count: calls.length,
                filters: filters
            }
        });

    } catch (error) {
        console.error('Error in call search route:', error);
        return NextResponse.json(
            { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}