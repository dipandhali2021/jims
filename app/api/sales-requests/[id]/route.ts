import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { SalesItem } from '@prisma/client';

// Helper to ensure user exists in database
async function ensureUserExists(userId: string) {
  let user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    const clerkUser = await clerkClient.users.getUser(userId);
    user = await prisma.user.create({
      data: {
        id: userId,
        email: clerkUser.emailAddresses[0].emailAddress,
        firstName: clerkUser.firstName || '',
        lastName: clerkUser.lastName || '',
        role: clerkUser.publicMetadata?.role as string || 'user'
      }
    });
  }
  return user;
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


    // Check if the user is authorized to update this request

    if (status === 'Approved') {
      // Update product stock for each item
      for (const item of salesRequest.items) {
        if (item.productId) {
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
    }

    // Create transaction record if request is approved
    if (status === 'Approved') {
      // Ensure user exists in database
      await ensureUserExists(salesRequest.userId);

      // Format items for transaction record with full product details
      const transactionItems = salesRequest.items.map(item => ({
        productId: item.productId,
        productName: item?.product?.name || item.productName,
        category: item?.product?.category,
        quantity: item.quantity,
        price: item.price,
        total: item.price * item.quantity,
        material: item?.product?.material,
        imageUrl: item?.product?.imageUrl || item.productImageUrl
      }));

      // Create transaction record
      await prisma.transaction.create({
        data: {
          orderId: salesRequest.requestId,
          customer: salesRequest.customer,
          totalAmount: salesRequest.totalValue,
          items: transactionItems,
          userId: salesRequest.userId,
        }
      });
    }

    // Update sales request status
    const updatedRequest = await prisma.salesRequest.update({
      where: { id },
      data: {
        status,
        // Update timestamp for approved requests
        ...(status === 'Approved' ? {
          requestDate: new Date()
        } : {})
      },
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
        message: `Your sales request (${salesRequest.requestId}) has been ${status.toLowerCase()}. Total value: ₹${salesRequest.totalValue.toFixed(2)}`,
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