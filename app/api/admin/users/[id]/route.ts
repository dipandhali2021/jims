import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';

export async function DELETE(
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

    const targetUserId = params.id;

    // Prevent admin from deleting themselves
    if (targetUserId === userId) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      );
    }

    // First check if user exists in Postgres
    const dbUser = await prisma.user.findUnique({
      where: { id: targetUserId }
    });

    if (dbUser) {
      // Delete all associated data from Postgres in correct order
      await prisma.$transaction(async (tx) => {
        // First delete all sales items that reference either user's products or sales requests
        await tx.salesItem.deleteMany({
          where: {
            OR: [
              {
                product: {
                  userId: targetUserId
                }
              },
              {
                salesRequest: {
                  userId: targetUserId
                }
              }
            ]
          }
        });

        // Delete sales requests
        await tx.salesRequest.deleteMany({
          where: { userId: targetUserId }
        });

        // Delete products
        await tx.product.deleteMany({
          where: { userId: targetUserId }
        });

        // Delete todos
        await tx.todo.deleteMany({
          where: { userId: targetUserId }
        });

        // Delete transactions
        await tx.transaction.deleteMany({
          where: { userId: targetUserId }
        });

        // Delete notifications
        await tx.notification.deleteMany({
          where: { userId: targetUserId }
        });

        // Finally delete the user record
        await tx.user.delete({
          where: { id: targetUserId }
        });
      });
    }

    // Delete the user from Clerk regardless of Postgres state
    await clerkClient.users.deleteUser(targetUserId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}