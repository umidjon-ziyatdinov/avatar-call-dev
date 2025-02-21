// @ts-nocheck
// app/api/calls/route.ts

import { getCallById, updateCall } from "@/lib/db/queries";
import { call } from "@/lib/db/schema";
import { z } from "zod";


const updateCallSchema = z.object({
    status: z.enum(['active', 'completed', 'failed', 'missed']).optional(),
    endedAt: z.string().datetime().optional().default(new Date().toISOString()),
    duration: z.number().optional(),
    recordingUrl: z.string().url().optional(),
    transcriptUrl: z.string().url().optional(),
    qualityMetrics: z.object({
        audioQuality: z.number(),
        videoQuality: z.number(),
        networkLatency: z.number(),
        dropouts: z.number(),
    }).optional(),
    conversationMetrics: z.object({
        userSpeakingTime: z.number(),
        avatarSpeakingTime: z.number(),
        turnsCount: z.number(),
        avgResponseTime: z.number(),
    }).optional(),
    errorLogs: z.array(z.object({
        timestamp: z.string(),
        error: z.string(),
        context: z.string(),
    })).optional(),
});


export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const json = await request.json();
        const validatedData = updateCallSchema.parse(json);

        // Calculate duration if endedAt is provided but duration isn't
        let duration = validatedData.duration;
        if (validatedData.endedAt && !duration) {
            const existingCall = await getCallById({ id })

            if (existingCall?.technicalDetails?.startTime) {
                const startTime = new Date(existingCall.technicalDetails.startTime);
                const endTime = new Date(validatedData.endedAt);
                duration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
            }
        }

        const updatedCall = await updateCall({
            id, data: {
                ...validatedData,
                duration,
                endedAt: validatedData.endedAt ? new Date(validatedData.endedAt) : undefined,
                // If status is being set to completed, ensure endedAt is set
                ...(validatedData.status === 'completed' && !validatedData.endedAt
                    ? { endedAt: new Date() }
                    : {}),
            }
        })
        if (!updatedCall) {
            return new Response(JSON.stringify({ error: 'Call not found' }), {
                status: 404,
            });
        }

        return new Response(JSON.stringify(updatedCall), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
            },
        });
    } catch (error) {
        console.error('Error updating call:', error);
        if (error instanceof z.ZodError) {
            return new Response(JSON.stringify({ error: 'Invalid request data', details: error.errors }), {
                status: 400,
            });
        }
        return new Response(JSON.stringify({ error: 'Internal server error' }), {
            status: 500,
        });
    }
}

// Optional: GET handler to fetch call details
// export async function GET(
//     request: Request,
//     { params }: { params: { id: string } }
// ) {
//     try {
//         const existingCall = await db.query.call.findFirst({
//             where: eq(call.id, params.id),
//         });

//         if (!existingCall) {
//             return new Response(JSON.stringify({ error: 'Call not found' }), {
//                 status: 404,
//             });
//         }

//         return new Response(JSON.stringify(existingCall), {
//             status: 200,
//             headers: {
//                 'Content-Type': 'application/json',
//             },
//         });
//     } catch (error) {
//         console.error('Error fetching call:', error);
//         return new Response(JSON.stringify({ error: 'Internal server error' }), {
//             status: 500,
//         });
//     }
// }