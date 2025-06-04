import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';

// Helper function to clean up old notifications (keep only 10 most recent)
async function cleanupOldNotifications(userId: string) {
  const notificationCount = await prisma.notification.count({
    where: { userId },
  });

  if (notificationCount > 10) {
    // Get the 10 most recent notifications
    const recentNotifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: { id: true },
    });

    const recentIds = recentNotifications.map(n => n.id);

    // Delete all notifications except the 10 most recent
    await prisma.notification.deleteMany({
      where: {
        userId,
        id: {
          notIn: recentIds,
        },
      },
    });
  }
}

export async function GET(req: NextRequest) {
  const { userId } = auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // First, clean up old notifications if there are more than 10
    await cleanupOldNotifications(userId);

    const notifications = await prisma.notification.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  const { userId } = auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id, isRead } = await req.json();

    const notification = await prisma.notification.update({
      where: { id },
      data: { isRead },
    });

    return NextResponse.json(notification);
  } catch (error) {
    console.error('Error updating notification:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const { userId } = auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id, deleteAll } = await req.json();

    if (deleteAll) {
      await prisma.notification.deleteMany({
        where: { userId },
      });
    } else if (id) {
      await prisma.notification.delete({
        where: { id },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting notification:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}