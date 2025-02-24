// app/api/calls/[id]/route.ts
import { auth } from "@/app/(auth)/auth";
import { getCallByIdForModerator } from "@/lib/db/call-queries";
import { getCallById } from "@/lib/db/queries";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: {
    params: Promise<{ id: string }>
  }
) {
  try {
    // 1. Wait for params to be available
    const { id } = await params;

    // 2. Authenticate moderator
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }


    if (session.user.role === 'admin') {
      const call = await getCallById({
        id,

      });
      return NextResponse.json(call);
    }
    // 4. Get call details with moderator verification
    const call = await getCallByIdForModerator({
      callId: id,
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