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
    let data;
    
    try {
      data = await req.json();
    } catch (error) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }
    
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
    
    if (approve) {
      // If approving, update the record
      const updatedVyapari = await prisma.vyapari.update({
        where: { id },
        data: {
          isApproved: true,
          approvedById: userId,
          status: existingVyapari.status || 'Active'
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
    } else {
      // Reject the vyapari - delete the record instead of just marking inactive
      await prisma.vyapari.delete({
        where: { id }
      });
      
      return NextResponse.json({ message: 'Trader rejected and removed successfully' });
    }
  } catch (error) {
    console.error(`Error updating vyapari approval status ${params.id}:`, error);
    return NextResponse.json(
      { error: 'Failed to update trader approval status' },
      { status: 500 }
    );
  }
}
