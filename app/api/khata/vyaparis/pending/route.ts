import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { userId } = auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch user to check role
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    // Only admin can see pending approvals
    if (user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Fetch pending vyaparis
    const pendingVyaparis = await prisma.vyapari.findMany({
      where: {
        isApproved: false
      },
      orderBy: [
        { createdAt: 'desc' }
      ],
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    return NextResponse.json(pendingVyaparis);
  } catch (error) {
    console.error('Error fetching pending vyaparis:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pending traders' },
      { status: 500 }
    );
  }
}
