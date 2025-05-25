import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(req: Request, { params }: RouteParams) {
  try {
    const { userId } = auth();
    const { id } = params;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch user to check role
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    const isAdmin = user?.role === 'admin';

    // Fetch karigar by ID with permissions check
    const karigar = await prisma.karigar.findUnique({
      where: {
        id: id,
        // Regular users can only see approved karigars
        ...(isAdmin ? {} : { isApproved: true })
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

    if (!karigar) {
      return NextResponse.json(
        { error: 'Karigar not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(karigar);
  } catch (error) {
    console.error(`Error fetching karigar ${params.id}:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch karigar details' },
      { status: 500 }
    );
  }
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

    const isAdmin = user?.role === 'admin';

    // Check if karigar exists
    const existingKarigar = await prisma.karigar.findUnique({
      where: { id }
    });

    if (!existingKarigar) {
      return NextResponse.json(
        { error: 'Karigar not found' },
        { status: 404 }
      );
    }

    // Non-admin users can only update basic info and cannot change status
    const updateData: any = {
      name: data.name?.trim(),
      phone: data.phone?.trim() || null,
      email: data.email?.trim() || null,
      address: data.address?.trim() || null,
      specialization: data.specialization?.trim() || null,
    };

    // Only admins can update status
    if (isAdmin && data.status) {
      updateData.status = data.status;
    }

    // Update karigar
    const updatedKarigar = await prisma.karigar.update({
      where: { id },
      data: updateData,
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

    return NextResponse.json(updatedKarigar);
  } catch (error) {
    console.error(`Error updating karigar ${params.id}:`, error);
    return NextResponse.json(
      { error: 'Failed to update karigar' },
      { status: 500 }
    );
  }
}
