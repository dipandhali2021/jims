import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function PUT(req: Request, { params }: RouteParams) {
  try {
    const { userId } = auth();
    const { id } = params;
    const data = await req.json();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch user to check role
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    // Only admin can approve/reject
    if (user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Check if vyapari exists
    const existingVyapari = await prisma.vyapari.findUnique({
      where: { id }
    });

    if (!existingVyapari) {
      return NextResponse.json(
        { error: 'Trader not found' },
        { status: 404 }
      );
    }

    // Approve or reject
    const approve = data.approve === true;
    
    const updatedVyapari = await prisma.vyapari.update({
      where: { id },
      data: {
        isApproved: approve,
        approvedById: userId,
        // If rejected, mark as inactive
        status: approve ? existingVyapari.status : 'Inactive'
      },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        approvedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    return NextResponse.json(updatedVyapari);
  } catch (error) {
    console.error(`Error updating vyapari approval status ${params.id}:`, error);
    return NextResponse.json(
      { error: 'Failed to update trader approval status' },
      { status: 500 }
    );
  }
}
