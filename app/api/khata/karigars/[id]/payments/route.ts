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

    // Fetch payments
    const payments = await prisma.karigarPayment.findMany({
      where: {
        karigarId: id
      },
      orderBy: [
        { createdAt: 'desc' }
      ]
    });

    return NextResponse.json(payments);
  } catch (error) {
    console.error(`Error fetching karigar payments ${params.id}:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch artisan payments' },
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
    if (typeof data.amount !== 'number' || data.amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be a positive number' },
        { status: 400 }
      );
    }

    if (!data.paymentMode || typeof data.paymentMode !== 'string') {
      return NextResponse.json(
        { error: 'Payment mode is required' },
        { status: 400 }
      );
    }

    // Generate payment ID: KP-YYYY-XXXX (KP for Karigar Payment)
    const currentYear = new Date().getFullYear();
    const paymentCountForYear = await prisma.karigarPayment.count({
      where: {
        paymentId: {
          startsWith: `KP-${currentYear}-`
        }
      }
    });
    
    const sequentialNumber = (paymentCountForYear + 1).toString().padStart(4, '0');
    const paymentId = `KP-${currentYear}-${sequentialNumber}`;    // Get user role from metadata
    const userRole = auth().sessionClaims?.metadata?.role as string || 'user';
    const isAdmin = userRole === 'admin';
      // Create payment - auto approve if admin, pending approval otherwise
    const payment = await prisma.karigarPayment.create({
      data: {
        paymentId,
        amount: data.amount,
        paymentMode: data.paymentMode,
        referenceNumber: data.referenceNumber || null,
        notes: data.notes || null,
        isApproved: isAdmin, // Auto-approve if admin, otherwise requires approval
        // Use the correct approvedBy relation structure
        ...(isAdmin ? { approvedBy: { connect: { id: userId } } } : {}),
        karigar: {
          connect: { id }
        },
        createdBy: {
          connect: { id: userId }
        }
      }
    });

    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    console.error(`Error creating karigar payment ${params.id}:`, error);
    return NextResponse.json(
      { error: 'Failed to create artisan payment' },
      { status: 500 }
    );
  }
}
