import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { userId } = auth();
  
  // Check if user is authenticated
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Fetch user to check role from database, which is more reliable
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true }
  });

  // Only admin can force delete
  if (user?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden. Only admin can force delete karigars.' }, { status: 403 });
  }

  const { id } = params;
  
  try {
    // First check if the karigar exists
    const karigar = await prisma.karigar.findUnique({
      where: { id }
    });

    if (!karigar) {
      return NextResponse.json(
        { error: 'Karigar not found' },
        { status: 404 }
      );
    }

    // Use a transaction to ensure all data is deleted properly
    await prisma.$transaction(async (tx) => {
      // First delete all related transactions
      await tx.karigarTransaction.deleteMany({
        where: { karigarId: id }
      });

      // Delete all related payments
      await tx.karigarPayment.deleteMany({
        where: { karigarId: id }
      });

      // Finally delete the karigar
      await tx.karigar.delete({
        where: { id }
      });
    });

    return NextResponse.json({ 
      message: 'Karigar and all related records deleted successfully',
      deletedId: id 
    });
  } catch (error) {
    console.error('Error force deleting karigar:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete karigar';
    return NextResponse.json(
      { error: `Failed to delete karigar: ${errorMessage}` },
      { status: 500 }
    );
  }
}
