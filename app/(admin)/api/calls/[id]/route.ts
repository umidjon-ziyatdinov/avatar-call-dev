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