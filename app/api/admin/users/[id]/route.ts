import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if the current user is an admin
    const currentUser = await clerkClient.users.getUser(userId);
    if (currentUser.publicMetadata.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const targetUserId = params.id;

    // Prevent admin from deleting themselves
    if (targetUserId === userId) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      );
    }

    // First check if user exists in Postgres
    const dbUser = await prisma.user.findUnique({
      where: { id: targetUserId }
    });

    if (dbUser) {
      // Process data outside of transaction to minimize transaction time
      // Find an admin user to reassign products to
      const adminUsers = await prisma.user.findMany({
        where: {
          role: 'admin',
          id: { not: targetUserId } // Don't include the user being deleted
        },
        take: 1
      });
      
      const newOwnerId = adminUsers.length > 0 ? adminUsers[0].id : null;
      
      // Delete all associated data from Postgres in correct order
      // Increase timeout to 30 seconds to handle large data sets
      await prisma.$transaction(async (tx) => {
        console.log("Starting user deletion transaction process");
        
        // 1. Handle products from the user being deleted
        // Find all products by this user
        const userProducts = await tx.product.findMany({
          where: { userId: targetUserId },
          select: { id: true }
        });
        const userProductIds = userProducts.map(p => p.id);
        
        // 2. Find all sales requests by this user
        const userSalesRequests = await tx.salesRequest.findMany({
          where: { userId: targetUserId },
          select: { id: true, status: true }
        });
        
        const pendingSalesRequestIds = userSalesRequests
          .filter(sr => sr.status !== "Completed")
          .map(sr => sr.id);
        
        const completedSalesRequestIds = userSalesRequests
          .filter(sr => sr.status === "Completed")
          .map(sr => sr.id);
          
        
        // 3. Handle SalesItems - First handle those attached to user's products
        // Update SalesItems that reference the user's products to preserve historical data
        await tx.salesItem.updateMany({
          where: {
            productId: { in: userProductIds.length > 0 ? userProductIds : undefined }
          },
          data: {
            productId: null
            // The productName, productSku, etc. should already be stored
          }
        });
        
        // 4. Delete SalesItems associated with pending sales requests
        if (pendingSalesRequestIds.length > 0) {
          await tx.salesItem.deleteMany({
            where: { salesRequestId: { in: pendingSalesRequestIds } }
          });
        }
        
        // 5. Transfer completed sales requests and their items to admin
        if (completedSalesRequestIds.length > 0 && newOwnerId) {
          await tx.salesRequest.updateMany({
            where: { id: { in: completedSalesRequestIds } },
            data: { userId: newOwnerId }
          });
        }
        
        // 6. Now we can delete pending sales requests
        if (pendingSalesRequestIds.length > 0) {
          await tx.salesRequest.deleteMany({
            where: { id: { in: pendingSalesRequestIds } }
          });
          console.log(`Deleted ${pendingSalesRequestIds.length} pending sales requests`);
        }

        // 7. Handle product requests - same pattern as sales requests
        const userProductRequests = await tx.productRequest.findMany({
          where: { userId: targetUserId },
          select: { id: true, status: true }
        });
        
        const pendingProductRequestIds = userProductRequests
          .filter(pr => pr.status !== "Approved")
          .map(pr => pr.id);
          
        const approvedProductRequestIds = userProductRequests
          .filter(pr => pr.status === "Approved")
          .map(pr => pr.id);
          
        
        // 8. Handle product request details for pending requests
        if (pendingProductRequestIds.length > 0) {
          await tx.productRequestDetails.deleteMany({
            where: { requestId: { in: pendingProductRequestIds } }
          });
        }
        
        // 9. Transfer approved product requests to admin
        if (approvedProductRequestIds.length > 0 && newOwnerId) {
          await tx.productRequest.updateMany({
            where: { id: { in: approvedProductRequestIds } },
            data: { userId: newOwnerId }
          });
        }
        
        // 10. Delete pending product requests
        if (pendingProductRequestIds.length > 0) {
          await tx.productRequest.deleteMany({
            where: { id: { in: pendingProductRequestIds } }
          });
        }

        // 11. Handle products - reassign to admin or delete if no admin
        if (userProductIds.length > 0) {
          if (newOwnerId) {
            // Reassign products to the admin user
            await tx.product.updateMany({
              where: { id: { in: userProductIds } },
              data: { userId: newOwnerId }
            });
          } else {
            // If no admin users exist to reassign to, we delete the products
            await tx.product.deleteMany({
              where: { id: { in: userProductIds } }
            });
          }
        }

        // 12. Delete other user data that doesn't need special handling
        await tx.todo.deleteMany({
          where: { userId: targetUserId }
        });

        await tx.transaction.deleteMany({
          where: { userId: targetUserId }
        });
        console.log("Deleted transactions");

        await tx.notification.deleteMany({
          where: { userId: targetUserId }
        });
        console.log("Deleted notifications");

        // 13. Finally delete the user record
        await tx.user.delete({
          where: { id: targetUserId }
        });
        console.log("Deleted user record");
      }, {
        // Increase timeout to 30 seconds for large datasets
        timeout: 30000,
        // This can help with locking issues
        isolationLevel: "Serializable"
      });
    }

    // Delete the user from Clerk regardless of Postgres state
    await clerkClient.users.deleteUser(targetUserId);
    console.log(`User ${targetUserId} deleted from Clerk`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}