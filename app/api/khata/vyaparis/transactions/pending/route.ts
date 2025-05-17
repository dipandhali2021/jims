import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { userId } = auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (user?.role !== 'admin') {
      return NextResponse.json({ error: 'Only admins can view pending transactions' }, { status: 403 });
    }

    // Fetch all pending transactions
    const pendingTransactions = await prisma.vyapariTransaction.findMany({
      where: {
        isApproved: false
      },
      include: {
        vyapari: {
          select: {
            id: true,
            name: true
          }
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(pendingTransactions);
  } catch (error) {
    console.error('Error fetching pending vyapari transactions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pending transactions' },
      { status: 500 }
    );
  }
}
