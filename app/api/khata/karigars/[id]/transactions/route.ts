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

    // Check if karigar exists and user has permission to view it
    const karigar = await prisma.karigar.findFirst({
      where: {
        id,
        OR: [
          { createdById: userId },
          { isApproved: true }
        ]
      }
    });

    if (!karigar) {
      return NextResponse.json(
        { error: 'Artisan not found' },
        { status: 404 }
      );
    }

    // Fetch transactions
    const transactions = await prisma.karigarTransaction.findMany({
      where: {
        karigarId: id
      },
      orderBy: [
        { createdAt: 'desc' }
      ]
    });

    return NextResponse.json(transactions);
  } catch (error) {
    console.error(`Error fetching karigar transactions ${params.id}:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch artisan transactions' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request, { params }: RouteParams) {
  try {
    const { userId } = auth();
    const { id } = params;
    const data = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if karigar exists and is approved
    const karigar = await prisma.karigar.findFirst({
      where: {
        id,
        isApproved: true
      }
    });

    if (!karigar) {
      return NextResponse.json(
        { error: 'Artisan not found or not approved' },
        { status: 404 }
      );
    }

    // Validate required fields
    if (!data.description || typeof data.description !== 'string' || !data.description.trim()) {
      return NextResponse.json(
        { error: 'Description is required' },
        { status: 400 }
      );
    }

    if (typeof data.amount !== 'number') {
      return NextResponse.json(
        { error: 'Amount must be a number' },
        { status: 400 }
      );
    }

    // Generate transaction ID: KT-YYYY-XXXX (KT for Karigar Transaction)
    const currentYear = new Date().getFullYear();
    const transactionCountForYear = await prisma.karigarTransaction.count({
      where: {
        transactionId: {
          startsWith: `KT-${currentYear}-`
        }
      }
    });
    
    const sequentialNumber = (transactionCountForYear + 1).toString().padStart(4, '0');
    const transactionId = `KT-${currentYear}-${sequentialNumber}`;    // Get user role from metadata
    const userRole = auth().sessionClaims?.metadata?.role as string || 'user';
    const isAdmin = userRole === 'admin';
      // Create transaction - auto approve if admin, pending approval otherwise
    const transactionData: any = {
      transactionId,
      description: data.description.trim(),
      amount: data.amount,
      items: data.items || null,
      isApproved: isAdmin, // Auto-approve if admin, otherwise requires approval
      // Use the correct approvedBy relation structure
      ...(isAdmin ? { approvedBy: { connect: { id: userId } } } : {}),
      karigar: {
        connect: { id }
      },
      createdBy: {
        connect: { id: userId }
      }
    };

    const transaction = await prisma.karigarTransaction.create({
      data: transactionData
    });

    return NextResponse.json(transaction, { status: 201 });
  } catch (error) {
    console.error(`Error creating karigar transaction ${params.id}:`, error);
    return NextResponse.json(
      { error: 'Failed to create artisan transaction' },
      { status: 500 }
    );
  }
}
