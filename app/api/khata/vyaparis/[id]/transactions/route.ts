import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { format } from 'date-fns';

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

    // Check if vyapari exists and user has permission to view it
    const vyapari = await prisma.vyapari.findFirst({
      where: {
        id,
        OR: [
          { createdById: userId },
          { isApproved: true }
        ]
      }
    });

    if (!vyapari) {
      return NextResponse.json(
        { error: 'Vyapari not found' },
        { status: 404 }
      );
    }

    // Fetch transactions
    const transactions = await prisma.vyapariTransaction.findMany({
      where: {
        vyapariId: id
      },
      orderBy: [
        { createdAt: 'desc' }
      ]
    });

    return NextResponse.json(transactions);
  } catch (error) {
    console.error(`Error fetching vyapari transactions ${params.id}:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch vyapari transactions' },
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

    // Check if vyapari exists and is approved
    const vyapari = await prisma.vyapari.findFirst({
      where: {
        id,
        isApproved: true
      }
    });

    if (!vyapari) {
      return NextResponse.json(
        { error: 'Vyapari not found or not approved' },
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

    // Generate transaction ID: VT-YYYY-XXXX (VT for Vyapari Transaction)
    const currentYear = new Date().getFullYear();
    const transactionCountForYear = await prisma.vyapariTransaction.count({
      where: {
        transactionId: {
          startsWith: `VT-${currentYear}-`
        }
      }
    });
    
    const sequentialNumber = (transactionCountForYear + 1).toString().padStart(4, '0');
    const transactionId = `VT-${currentYear}-${sequentialNumber}`;    // Get user role from metadata
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
      vyapari: {
        connect: { id }
      },
      createdBy: {
        connect: { id: userId }
      }
    };

    const transaction = await prisma.vyapariTransaction.create({
      data: transactionData
    });

    return NextResponse.json(transaction, { status: 201 });
  } catch (error) {
    console.error(`Error creating vyapari transaction ${params.id}:`, error);
    return NextResponse.json(
      { error: 'Failed to create vyapari transaction' },
      { status: 500 }
    );
  }
}
