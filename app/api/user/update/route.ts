import prisma from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export async function PUT(req: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await req.json();
    const { firstName, lastName } = body;

    // Validate input
    if (!firstName || !lastName) {
      return new NextResponse('First name and last name are required', { status: 400 });
    }

    // Update user in database
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        firstName,
        lastName,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('[USER_UPDATE]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}