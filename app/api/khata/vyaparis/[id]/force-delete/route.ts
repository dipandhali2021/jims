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
    return NextResponse.json({ error: 'Forbidden. Only admin can force delete traders.' }, { status: 403 });
  }

  const { id } = params;
    try {
    // First check if the vyapari exists
    const vyapari = await prisma.vyapari.findUnique({
      where: { id }
    });

    if (!vyapari) {
      return NextResponse.json(
        { error: 'Trader not found' },
        { status: 404 }
      );
    }

    // Use a transaction to ensure all data is deleted properly
    await prisma.$transaction(async (tx) => {
      // First delete all related transactions
      await tx.vyapariTransaction.deleteMany({
        where: { vyapariId: id }
      });

      // Delete all related payments
      await tx.vyapariPayment.deleteMany({
        where: { vyapariId: id }
      });

      // Finally delete the vyapari
      await tx.vyapari.delete({
        where: { id }
      });
    });

    return NextResponse.json({ 
      message: 'Trader and all related records deleted successfully',
      deletedId: id 
    });
  } catch (error) {
    console.error('Error force deleting vyapari:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete trader';
    return NextResponse.json(
      { error: `Failed to delete trader: ${errorMessage}` },
      { status: 500 }
    );
  }
}
