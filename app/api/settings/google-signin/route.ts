import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';

// GET endpoint to fetch the current Google sign-in visibility setting
// This is public so the sign-in page can check it
export async function GET() {
  try {
    // Try to get the settings, create default if they don't exist
    let settings = await prisma.appSettings.findUnique({
      where: {
        id: 'default',
      },
    });

    // Create default settings if none exist
    if (!settings) {
      settings = await prisma.appSettings.create({
        data: {
          id: 'default',
          showGoogleSignIn: true,
        },
      });
    }

    return NextResponse.json({ showGoogleSignIn: settings.showGoogleSignIn });
  } catch (error) {
    console.error('Error fetching Google sign-in settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Google sign-in settings' },
      { status: 500 }
    );
  }
}

// PATCH endpoint to update the Google sign-in visibility setting
// This remains admin-only
export async function PATCH(request: Request) {
  try {
    // Get the current user to check if they're an admin
    const user = await currentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Fetch user role from database
    const userData = await prisma.user.findUnique({
      where: {
        id: user.id,
      },
    });
    
    // Check if user is an admin
    if (!userData || userData.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }
    
    // Parse request body
    const data = await request.json();
    const { showGoogleSignIn } = data;
    
    if (typeof showGoogleSignIn !== 'boolean') {
      return NextResponse.json(
        { error: 'Invalid data - showGoogleSignIn must be a boolean' },
        { status: 400 }
      );
    }
    
    // Update the settings
    const updatedSettings = await prisma.appSettings.upsert({
      where: {
        id: 'default',
      },
      update: {
        showGoogleSignIn,
      },
      create: {
        id: 'default',
        showGoogleSignIn,
      },
    });
    
    return NextResponse.json({
      showGoogleSignIn: updatedSettings.showGoogleSignIn,
    });
  } catch (error) {
    console.error('Error updating Google sign-in settings:', error);
    return NextResponse.json(
      { error: 'Failed to update Google sign-in settings' },
      { status: 500 }
    );
  }
}