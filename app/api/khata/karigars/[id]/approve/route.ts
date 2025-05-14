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

    // Check if karigar exists
    const existingKarigar = await prisma.karigar.findUnique({
      where: { id }
    });

    if (!existingKarigar) {
      return NextResponse.json(
        { error: 'Artisan not found' },
        { status: 404 }
      );
    }
    
    // Approve or reject
    const approve = data.approve === true;
    
    if (approve) {
      // If approving, update the record
      const updatedKarigar = await prisma.karigar.update({
        where: { id },
        data: {
          isApproved: true,
          approvedById: userId,
          status: existingKarigar.status || 'Active'
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
      
      return NextResponse.json(updatedKarigar);
    } else {
      // Reject the karigar - delete the record instead of just marking inactive
      await prisma.karigar.delete({
        where: { id }
      });
      
      return NextResponse.json({ message: 'Artisan rejected and removed successfully' });
    }
  } catch (error) {
    console.error(`Error updating karigar approval status ${params.id}:`, error);
    return NextResponse.json(
      { error: 'Failed to update artisan approval status' },
      { status: 500 }
    );
  }
}
