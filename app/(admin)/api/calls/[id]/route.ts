import { getCallById } from "@/lib/db/queries";

export async function GET(
    request: Request,
    { params }: {
        params: Promise<{ id: string }>
    }
) {
    const { id } = await params
    try {
        const existingCall = await getCallById({ id })

        if (!existingCall) {
            return new Response(JSON.stringify({ error: 'Call not found' }), {
                status: 404,
            });
        }

        return new Response(JSON.stringify(existingCall), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
            },
        });
    } catch (error) {
        console.error('Error fetching call:', error);
        return new Response(JSON.stringify({ error: 'Internal server error' }), {
            status: 500,
        });
    }
}