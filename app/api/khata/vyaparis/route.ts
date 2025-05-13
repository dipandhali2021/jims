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

    // Fetch only approved vyaparis for regular users, or all for admin
    const vyaparis = await prisma.vyapari.findMany({
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

    return NextResponse.json(vyaparis);
  } catch (error) {
    console.error('Error fetching vyaparis:', error);
    return NextResponse.json(
      { error: 'Failed to fetch traders' },
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

    // Create new vyapari
    const vyapari = await prisma.vyapari.create({
      data: {
        name: data.name.trim(),
        phone: data.phone?.trim() || null,
        email: data.email?.trim() || null,
        address: data.address?.trim() || null,
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

    return NextResponse.json(vyapari, { status: 201 });
  } catch (error) {
    console.error('Error creating vyapari:', error);
    
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return NextResponse.json(
          { error: 'A trader with this information already exists' },
          { status: 400 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to create trader' },
      { status: 500 }
    );
  }
}
