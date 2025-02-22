// app/api/calls/[id]/route.ts
import { auth } from "@/app/(auth)/auth";
import { getCallByIdForModerator } from "@/lib/db/call-queries";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Wait for params to be available
    const callId = await params.id;
    
    // 2. Authenticate moderator
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // 3. Check if user is a moderator
    if (session.user.role !== 'moderator') {
      return NextResponse.json(
        { error: 'Unauthorized. Moderator access required.' },
        { status: 403 }
      );
    }

    // 4. Get call details with moderator verification
    const call = await getCallByIdForModerator({
      callId,
      moderatorId: session.user.id
    });

    if (!call) {
      return NextResponse.json(
        { error: 'Call not found or access denied' },
        { status: 404 }
      );
    }

    return NextResponse.json(call);
  } catch (error) {
    console.error('Error fetching call:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}