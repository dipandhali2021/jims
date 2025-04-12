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

    let name: string;
    let sku: string;
    let description: string;
    let category: string;
    let material: string;
    let price: number;
    let stock: number;
    let imageUrl: string | undefined;
    let uploadedImage: File | Blob | null = null;

    const contentType = req.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      // Handle JSON request
      const jsonData = await req.json();
      name = jsonData.name;
      sku = jsonData.sku;
      description = jsonData.description || '';
      category = jsonData.category;
      material = jsonData.material;
      price = parseFloat(jsonData.price);
      stock = parseInt(jsonData.stock);
      imageUrl = jsonData.imageUrl;
    } else {
      // Handle FormData request
      const formData = await req.formData();
      uploadedImage = formData.get('image') as File | null;
      
      // Log the received form data (excluding image binary data)
      const formDataEntries = Array.from(formData.entries())
        .filter(([key]) => key !== 'image')
        .map(([key, value]) => `${key}: ${value}`);
      console.log('Form data received:', formDataEntries);
      
      name = formData.get('name') as string;
      sku = formData.get('sku') as string;
      description = formData.get('description') as string || '';
      category = formData.get('category') as string;
      material = formData.get('material') as string;
      price = parseFloat(formData.get('price') as string);
      stock = parseInt(formData.get('stock') as string);

    }

    // Validate required fields
    if (!name || !sku || !category || !material || isNaN(price) || isNaN(stock)) {
      console.error('Missing required fields');
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // For FormData requests, handle image upload
    if (contentType?.includes('multipart/form-data')) {
      if (uploadedImage && uploadedImage instanceof Blob) {
        // Convert the file to base64
        const bytes = await uploadedImage.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const base64Image = buffer.toString('base64');
        
        // Upload to Cloudinary
        console.log('Uploading to Cloudinary...');
        const result = await cloudinary.uploader.upload(
          `data:${uploadedImage.type};base64,${base64Image}`,
          {
            folder: 'jewelry-inventory',
          }
        );
        imageUrl = result.secure_url;
        console.log('Cloudinary upload successful:', imageUrl);
      }
    }

    // Ensure we have either an uploaded image URL or a provided image URL
    if (!imageUrl) {
      console.error('No image URL provided');
      return NextResponse.json(
        { error: 'Image URL is required' },
        { status: 400 }
      );
    }


    // Check if SKU already exists
    const existingProduct = await prisma.product.findUnique({
      where: { sku },
    });

    if (existingProduct) {
      console.error('Product ID already exists:', sku);
      return NextResponse.json(
        { error: 'Product ID already exists' },
        { status: 409 }
      );
    }

    // Create product in database
    console.log('Creating product in database...');
    const product = await prisma.product.create({
      data: {
        name,
        sku,
        description,
        category,
        material,
        price,
        stock,
        imageUrl,
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
    const products = await prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
    });
    console.log('Fetched products:', products.length);
    return NextResponse.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Error fetching products' },
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
    console.log(`Deleting product with ID: ${id}`);

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      console.log(`Product with ID ${id} not found`);
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Delete product from database
    await prisma.product.delete({
      where: { id },
    });
    
    console.log(`Product ${id} deleted successfully`);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`Error deleting product: ${error}`);
    return NextResponse.json(
      { error: 'Error deleting product' },
      { status: 500 }
    );
  }
}