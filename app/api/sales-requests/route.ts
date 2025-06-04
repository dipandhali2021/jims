import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { use } from 'react';

// Helper function to generate request ID
function generateRequestId() {
  const year = new Date().getFullYear();
  const random = Math.floor(1000 + Math.random() * 9000);
  return `SR-${year}-${random}`;
}

// Helper function to find admin users
async function findAdminUsers() {
  try {
    const users = await clerkClient.users.getUserList({
      limit: 100,
    });

    console.log('Admin users found:', users?.data?.filter(user => user.publicMetadata && typeof user.publicMetadata === 'object' && user.publicMetadata.role === 'admin').map(user => user.id));
    return users?.data?.filter(user =>
      user.publicMetadata &&
      typeof user.publicMetadata === 'object' &&
      user.publicMetadata.role === 'admin'
    ).map(user => user.id);
  } catch (error) {
    console.error('Error finding admin users:', error);
    return [];
  }
}

// Helper function to clean up old notifications (keep only 10 most recent)
async function cleanupOldNotifications(userId: string) {
  const notificationCount = await prisma.notification.count({
    where: { userId },
  });

  if (notificationCount > 10) {
    // Get the 10 most recent notifications
    const recentNotifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: { id: true },
    });

    const recentIds = recentNotifications.map(n => n.id);

    // Delete all notifications except the 10 most recent
    await prisma.notification.deleteMany({
      where: {
        userId,
        id: {
          notIn: recentIds,
        },
      },
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user details from Clerk
    const clerkUser = await clerkClient.users.getUser(userId);
    if (!clerkUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Ensure user exists in our database
    let user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      // Create user if they don't exist
      user = await prisma.user.create({
        data: {
          id: userId,
          email: clerkUser.emailAddresses[0].emailAddress,
          firstName: clerkUser.firstName || '',
          lastName: clerkUser.lastName || '',
          role: clerkUser.publicMetadata?.role as string || 'user'
        }
      });
    }    const { customer, vyapariId, items } = await req.json();

    if (!customer || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      );
    }

    // Calculate total value and validate products
    let totalValue = 0;
    const productIds = items.map(item => item.productId);
    
    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds }
      }
    });

    // Validate all products exist and have sufficient stock
    for (const item of items) {
      const product = products.find(p => p.id === item.productId);
      if (!product) {
        return NextResponse.json(
          { error: `Product not found: ${item.productId}` },
          { status: 400 }
        );
      }
      if (product.stock < item.quantity) {
        return NextResponse.json(
          { error: `Insufficient stock for product: ${product.name}` },
          { status: 400 }
        );
      }      // Use custom price if provided, otherwise use default product price
      const itemPrice = item.customPrice !== undefined ? item.customPrice : product.price;
      totalValue += itemPrice * item.quantity;
    }    // Create sales request with unique request ID
    const salesRequest = await prisma.salesRequest.create({
      data: {
        requestId: generateRequestId(),
        customer,
        totalValue,
        userId,
        ...(vyapariId ? { vyapariId } : {}), // Only include vyapariId if it exists
        items: {
          create: items.map(item => ({            quantity: item.quantity,
            price: item.customPrice !== undefined 
              ? item.customPrice 
              : products.find(p => p.id === item.productId)!.price,
            productId: item.productId,
            productName: products.find(p => p.id === item.productId)!.name,
            productSku: products.find(p => p.id === item.productId)!.sku,
            productImageUrl: products.find(p => p.id === item.productId)!.imageUrl
          }))
        }
      },
      include: {
        items: {
          include: {
            product: true
          }
        },
        user: true
      }
    });

    // Find admin users and create notifications for them
    const adminUserIds = await findAdminUsers();
    
    if (adminUserIds.length > 0) {
      // Create notifications for all admin users
      await prisma.notification.createMany({
        data: adminUserIds.map(adminId => ({
          title: 'New Sales Request',
          message: `New sales request (${salesRequest.requestId}) created by ${salesRequest.user.firstName} ${salesRequest.user.lastName} for customer ${customer}. Total value: ₹${totalValue.toFixed(2)}`,
          type: 'sales_request',
          userId: adminId,
        }))
      });
    }

    return NextResponse.json(salesRequest, { status: 201 });
  } catch (error) {
    console.error('Error creating sales request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const salesRequests = await prisma.salesRequest.findMany({
      include: {
        items: {
          include: {
            product: true
          }
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(salesRequests);
  } catch (error) {
    console.error('Error fetching sales requests:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user details from Clerk
    const clerkUser = await clerkClient.users.getUser(userId);
    if (!clerkUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user is admin
    const isAdmin = clerkUser.publicMetadata?.role === 'admin';
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Delete all sales items first (handle foreign key constraints)
    await prisma.salesItem.deleteMany({});

    // Then delete all sales requests
    await prisma.salesRequest.deleteMany({});

    // Return success response
    return NextResponse.json({ message: 'All sales requests deleted successfully' });
  } catch (error) {
    console.error('Error deleting sales requests:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}