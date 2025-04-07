import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { status } = await req.json();
    const id = params.id;

    if (!['Approved', 'Rejected'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }

    // Get the sales request with its items and user
    const salesRequest = await prisma.salesRequest.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: true
          }
        },
        user: true
      }
    });

    if (!salesRequest) {
      return NextResponse.json(
        { error: 'Sales request not found' },
        { status: 404 }
      );
    }

    if (status === 'Approved') {
      // Update product stock for each item
      for (const item of salesRequest.items) {
        await prisma.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.quantity
            }
          }
        });
      }
    }

    // Update sales request status
    const updatedRequest = await prisma.salesRequest.update({
      where: { id },
      data: { status },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    });

    // Create notification for the shopkeeper
    await prisma.notification.create({
      data: {
        title: `Sales Request ${status}`,
        message: `Your sales request (${salesRequest.requestId}) has been ${status.toLowerCase()}. Total value: $${salesRequest.totalValue.toFixed(2)}`,
        type: 'status_update',
        userId: salesRequest.userId,
      }
    });

    return NextResponse.json(updatedRequest);
  } catch (error) {
    console.error('Error updating sales request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}