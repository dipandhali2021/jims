import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Log the start of the request processing
    console.log('Processing product creation request');

    const formData = await req.formData();
    
    // Log the received form data (excluding image binary data)
    const formDataEntries = Array.from(formData.entries())
      .filter(([key]) => key !== 'image')
      .map(([key, value]) => `${key}: ${value}`);
    console.log('Form data received:', formDataEntries);
    
    const name = formData.get('name') as string;
    const sku = formData.get('sku') as string;
    const description = formData.get('description') as string;
    const category = formData.get('category') as string;
    const material = formData.get('material') as string;
    const price = parseFloat(formData.get('price') as string);
    const stock = parseInt(formData.get('stock') as string);
    const image = formData.get('image');

    // Validate required fields
    if (!name || !sku || !category || !material || isNaN(price) || isNaN(stock)) {
      console.error('Missing required fields');
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if image is provided and is a File
    if (!image || !(image instanceof Blob)) {
      console.error('Invalid image format');
      return NextResponse.json(
        { error: 'Invalid image format' },
        { status: 400 }
      );
    }

    console.log('Image received:', image.type, image.size);

    // Convert the file to base64
    const bytes = await image.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Image = buffer.toString('base64');
    
    console.log('Image converted to base64');

    // Upload to Cloudinary
    console.log('Uploading to Cloudinary...');
    const result = await cloudinary.uploader.upload(
      `data:${image.type};base64,${base64Image}`,
      {
        folder: 'jewelry-inventory',
      }
    );
    console.log('Cloudinary upload successful:', result.secure_url);

    // Check if SKU already exists
    const existingProduct = await prisma.product.findUnique({
      where: { sku },
    });

    if (existingProduct) {
      console.error('SKU already exists:', sku);
      return NextResponse.json(
        { error: 'SKU already exists' },
        { status: 409 }
      );
    }

    // Create product in database
    console.log('Creating product in database...');
    const product = await prisma.product.create({
      data: {
        name,
        sku,
        description: description || '',
        category,
        material,
        price,
        stock,
        imageUrl: result.secure_url,
        userId,
      },
    });
    console.log('Product created successfully:', product.id);

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: 'Error creating product' },
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

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const material = searchParams.get('material') || '';

    const products = await prisma.product.findMany({
      where: {
        userId,
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { sku: { contains: search, mode: 'insensitive' } },
          ],
        }),
        ...(category && { category }),
        ...(material && { material }),
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Error fetching products' },
      { status: 500 }
    );
  }
}