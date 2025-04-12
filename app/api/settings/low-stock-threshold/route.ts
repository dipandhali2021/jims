import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin using Clerk metadata
    const user = await clerkClient.users.getUser(userId);
    if (user.publicMetadata.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { threshold } = await req.json();
    
    // Validate threshold
    if (typeof threshold !== 'number' || threshold < 0) {
      return NextResponse.json(
        { error: 'Invalid threshold value' },
        { status: 400 }
      );
    }

    // Update all products with the new threshold
    await prisma.product.updateMany({
      data: {
        lowStockThreshold: threshold,
      },
    });

    return NextResponse.json({ success: true, threshold });
  } catch (error) {
    console.error('Error updating low stock threshold:', error);
    return NextResponse.json(
      { error: 'Error updating low stock threshold' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the first product to check its threshold
    // This assumes all products have the same threshold value
    const product = await prisma.product.findFirst({
      select: {
        lowStockThreshold: true,
      },
    });

    const threshold = product?.lowStockThreshold || 10; // Default to 10 if no products exist

    return NextResponse.json({ threshold });
  } catch (error) {
    console.error('Error fetching low stock threshold:', error);
    return NextResponse.json(
      { error: 'Error fetching low stock threshold' },
      { status: 500 }
    );
  }
}