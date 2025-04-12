import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if the current user is an admin
    const currentUser = await clerkClient.users.getUser(userId);
    if (currentUser.publicMetadata.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { role } = await req.json();
    const targetUserId = params.id;

    // Validate role
    if (!['user', 'admin'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role specified' },
        { status: 400 }
      );
    }

    // Update user's role in both Clerk and database
    await Promise.all([
      // Update in Clerk
      clerkClient.users.updateUser(targetUserId, {
        publicMetadata: { role },
      }),
      // Update in Prisma database
      prisma.user.update({
        where: { id: targetUserId },
        data: { role }
      })
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating user role:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}