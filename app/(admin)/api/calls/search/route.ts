// app/api/calls/search/route.ts
import { NextResponse } from 'next/server';
import { getModeratorCalls } from '@/lib/db/queries';
import { z } from 'zod';

// Input validation schema
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
        const body = await request.json();

        // Validate input
        const validatedParams = searchParamsSchema.safeParse(body);

        if (!validatedParams.success) {
            return NextResponse.json(
                { error: 'Invalid parameters', details: validatedParams.error.errors },
                { status: 400 }
            );
        }

        // Transform dates from strings to Date objects if they exist
        const filters = {
            ...validatedParams.data,
            startDate: validatedParams.data.startDate
                ? new Date(validatedParams.data.startDate).toISOString().split('T')[0]
                : undefined,
            endDate: validatedParams.data.endDate
                ? new Date(validatedParams.data.endDate).toISOString().split('T')[0]
                : undefined,
        };

        // Fetch calls with filters
        const calls = await getModeratorCalls(filters);

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

// Optional: GET method to handle direct API access or SSR
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);

        // Convert search params to filters object
        const filters = {
            userId: searchParams.get('userId') || undefined,
            avatarId: searchParams.get('avatarId') || undefined,
            status: searchParams.get('status') as 'active' | 'completed' | 'failed' | 'missed' | undefined,
            startDate: searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined,
            endDate: searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined,
            duration: searchParams.get('duration') ? Number(searchParams.get('duration')) : undefined,
            search: searchParams.get('search') || undefined,
        };

        // Validate input
        const validatedParams = searchParamsSchema.safeParse(filters);

        if (!validatedParams.success) {
            return NextResponse.json(
                { error: 'Invalid parameters', details: validatedParams.error.errors },
                { status: 400 }
            );
        }

        const validatedData = {
            ...validatedParams.data,
            startDate: validatedParams.data.startDate ? new Date(validatedParams.data.startDate) : undefined,
            endDate: validatedParams.data.endDate ? new Date(validatedParams.data.endDate) : undefined,
        };

        // Fetch calls with filters
        const calls = await getModeratorCalls(validatedData);

        return NextResponse.json({
            status: 'success',
            data: calls,
            metadata: {
                count: calls.length,
                filters: validatedParams.data
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