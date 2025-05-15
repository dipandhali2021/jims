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
    console.log('Processing product creation request');    let name: string;
    let sku: string;
    let description: string;
    let category: string;
    let material: string;
    let price: number;
    let costPrice: number | undefined;
    let stock: number;
    let imageUrl: string | undefined;
    let supplier: string | undefined;
    let uploadedImage: File | Blob | null = null;

    const contentType = req.headers.get('content-type');
    if (contentType?.includes('application/json')) {    // Handle JSON request
      const jsonData = await req.json();
      name = jsonData.name;
      sku = jsonData.sku;
      description = jsonData.description || '';
      category = jsonData.category;
      material = jsonData.material;
      price = parseFloat(jsonData.price);
      costPrice = jsonData.costPrice ? parseFloat(jsonData.costPrice) : undefined;
      stock = parseInt(jsonData.stock);
      imageUrl = jsonData.imageUrl;
      supplier = jsonData.supplier;
    } else {
      // Handle FormData request
      const formData = await req.formData();
      uploadedImage = formData.get('image') as File | null;
      
      // Log the received form data (excluding image binary data)
      const formDataEntries = Array.from(formData.entries())
        .filter(([key]) => key !== 'image')
        .map(([key, value]) => `${key}: ${value}`);
      console.log('Form data received:', formDataEntries);      name = formData.get('name') as string;
      sku = formData.get('sku') as string;
      description = formData.get('description') as string || '';
      category = formData.get('category') as string;
      material = formData.get('material') as string;
      price = parseFloat(formData.get('price') as string);
      costPrice = formData.get('costPrice') ? parseFloat(formData.get('costPrice') as string) : undefined;
      stock = parseInt(formData.get('stock') as string);
      supplier = formData.get('supplier') as string || undefined;
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
        try {
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
        } catch (error) {
          console.error('Error uploading to Cloudinary:', error);
          // Continue with default image if upload fails
          imageUrl = 'https://lgshoplocal.com/wp-content/uploads/2020/04/placeholderproduct-500x500-1.png';
        }
      }
    }

    // Ensure we have either an uploaded image URL or a provided image URL
    if (!imageUrl) {
      imageUrl = 'https://lgshoplocal.com/wp-content/uploads/2020/04/placeholderproduct-500x500-1.png';
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
        costPrice,
        stock,
        imageUrl,
        supplier,
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

    const searchParams = req.nextUrl.searchParams;
    const query = searchParams.get('query')?.toLowerCase() || '';
    const category = searchParams.get('category') || '';
    const material = searchParams.get('material') || '';
    const sort = searchParams.get('sort') || '';

    // Build filter conditions
    const whereClause: any = {};

    if (query) {
      whereClause.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { sku: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
      ];
    }

    if (category) {
      whereClause.category = category;
    }

    if (material) {
      whereClause.material = material;
    }

    // Build sort order
    let orderBy: any = {};

    switch (sort) {
      case 'nameAsc':
        orderBy = { name: 'asc' };
        break;
      case 'nameDesc':
        orderBy = { name: 'desc' };
        break;
      case 'priceAsc':
        orderBy = { price: 'asc' };
        break;
      case 'priceDesc':
        orderBy = { price: 'desc' };
        break;
      case 'stockAsc':
        orderBy = { stock: 'asc' };
        break;
      case 'stockDesc':
        orderBy = { stock: 'desc' };
        break;
      default:
        orderBy = { updatedAt: 'desc' };
    }

    const products = await prisma.product.findMany({
      where: whereClause,
      orderBy,
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