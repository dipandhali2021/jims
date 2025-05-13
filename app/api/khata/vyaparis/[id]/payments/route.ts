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
        { error: 'Trader not found' },
        { status: 404 }
      );
    }

    // Fetch payments
    const payments = await prisma.vyapariPayment.findMany({
      where: {
        vyapariId: id
      },
      orderBy: [
        { createdAt: 'desc' }
      ]
    });

    return NextResponse.json(payments);
  } catch (error) {
    console.error(`Error fetching vyapari payments ${params.id}:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch trader payments' },
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
        { error: 'Trader not found or not approved' },
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

    // Generate payment ID: VP-YYYY-XXXX (VP for Vyapari Payment)
    const currentYear = new Date().getFullYear();
    const paymentCountForYear = await prisma.vyapariPayment.count({
      where: {
        paymentId: {
          startsWith: `VP-${currentYear}-`
        }
      }
    });
    
    const sequentialNumber = (paymentCountForYear + 1).toString().padStart(4, '0');
    const paymentId = `VP-${currentYear}-${sequentialNumber}`;

    // Create payment
    const payment = await prisma.vyapariPayment.create({
      data: {
        paymentId,
        amount: data.amount,
        paymentMode: data.paymentMode,
        referenceNumber: data.referenceNumber || null,
        notes: data.notes || null,
        vyapari: {
          connect: { id }
        },
        createdBy: {
          connect: { id: userId }
        }
      }
    });

    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    console.error(`Error creating vyapari payment ${params.id}:`, error);
    return NextResponse.json(
      { error: 'Failed to create trader payment' },
      { status: 500 }
    );
  }
}
