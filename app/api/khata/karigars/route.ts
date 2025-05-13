import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

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

    const isAdmin = user?.role === 'admin';

    // Fetch only approved karigars for regular users, or all for admin
    const karigars = await prisma.karigar.findMany({
      where: {
        ...(isAdmin ? {} : { isApproved: true, status: 'Active' })
      },
      orderBy: [
        { name: 'asc' }
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

    return NextResponse.json(karigars);
  } catch (error) {
    console.error('Error fetching karigars:', error);
    return NextResponse.json(
      { error: 'Failed to fetch artisans' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
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

    const isAdmin = user?.role === 'admin';
    const data = await req.json();

    // Validate required fields
    if (!data.name || typeof data.name !== 'string' || !data.name.trim()) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    // Create new karigar
    const karigar = await prisma.karigar.create({
      data: {
        name: data.name.trim(),
        phone: data.phone?.trim() || null,
        email: data.email?.trim() || null,
        address: data.address?.trim() || null,
        specialization: data.specialization?.trim() || null,
        // Auto-approve if created by admin
        isApproved: isAdmin,
        approvedById: isAdmin ? userId : null,
        createdById: userId
      },
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

    return NextResponse.json(karigar, { status: 201 });
  } catch (error) {
    console.error('Error creating karigar:', error);
    
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return NextResponse.json(
          { error: 'An artisan with this information already exists' },
          { status: 400 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to create artisan' },
      { status: 500 }
    );
  }
}
