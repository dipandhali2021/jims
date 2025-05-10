import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const id = params.id;
    const bill = await prisma.bill.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!bill) {
      return NextResponse.json(
        { error: 'Bill not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(bill);
  } catch (error) {
    console.error('Error fetching bill:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const id = params.id;
    const data = await req.json();
    const { 
      customerName, 
      customerAddress, 
      customerState,
      customerGSTIN,
      items,
      totalAmount,
      sgst,
      cgst,
      igst,
      hsnCodes,
      transportMode,
      vehicleNo,
      placeOfSupply,
      isTaxable
    } = data;

    const bill = await prisma.bill.findUnique({
      where: { id },
    });

    if (!bill) {
      return NextResponse.json(
        { error: 'Bill not found' },
        { status: 404 }
      );
    }

    // Update bill
    const updatedBill = await prisma.bill.update({
      where: { id },
      data: {
        customerName,
        customerAddress, 
        customerState,
        customerGSTIN,
        items,
        totalAmount,
        sgst,
        cgst,
        igst,
        hsnCodes,
        transportMode,
        vehicleNo,
        placeOfSupply,
        isTaxable,
        updatedBy: userId,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(updatedBill);
  } catch (error) {
    console.error('Error updating bill:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const id = params.id;
    const bill = await prisma.bill.findUnique({
      where: { id },
    });

    if (!bill) {
      return NextResponse.json(
        { error: 'Bill not found' },
        { status: 404 }
      );
    }

    // Delete bill
    await prisma.bill.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Bill deleted successfully' });
  } catch (error) {
    console.error('Error deleting bill:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
