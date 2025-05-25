import { NextRequest, NextResponse } from "next/server";
import { clerkClient, currentUser } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { uploadImageToStorage, getImageUrl } from "../../../utils";

// Helper function to generate request ID
async function generateRequestId(): Promise<string> {
  const year = new Date().getFullYear();
  const requestCount = await prisma.productRequest.count({
    where: {
      requestId: {
        startsWith: `PR-${year}`
      }
    }
  });
  const sequence = (requestCount + 1).toString().padStart(4, '0');
  return `PR-${year}-${sequence}`;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userInfo = await clerkClient.users.getUser(user.id);
    const userRole = userInfo.publicMetadata.role as string || "user";

    // Get the existing product
    const existingProduct = await prisma.longSetProduct.findUnique({
      where: { id: params.id },
      include: {
        parts: true,
        product: true,
      },
    });

    if (!existingProduct) {
      return NextResponse.json(
        { error: "Long set product not found" },
        { status: 404 }
      );
    }

    // Check if product relationship exists
    if (!existingProduct.product) {
      return NextResponse.json(
        { error: "Base product reference not found" },
        { status: 400 }
      );
    }

    // Parse the request data
    let updateData;
    let imageUrl = existingProduct.imageUrl;

    if (request.headers.get("content-type")?.includes("multipart/form-data")) {
      const formData = await request.formData();
      const image = formData.get("image") as File;
      
      if (image) {
        const uploadResult = await uploadImageToStorage(image);
        imageUrl = await getImageUrl(uploadResult.path);
      }

      updateData = {
        name: formData.get("name") as string,
        sku: formData.get("sku") as string,
        description: formData.get("description") as string,
        category: formData.get("category") as string,
        material: formData.get("material") as string,
        price: parseFloat(formData.get("price") as string),
        costPrice: formData.get("costPrice") ? parseFloat(formData.get("costPrice") as string) : null,
        stock: parseInt(formData.get("stock") as string),
        imageUrl,
        parts: JSON.parse(formData.get("parts") as string),
      };
    } else {
      const body = await request.json();
      updateData = {
        ...body,
        imageUrl: body.imageUrl || imageUrl,
      };
    }

    // For admin actions, create a product request instead of direct update
    if (userRole === "admin") {
      const requestId = await generateRequestId();      const productRequest = await prisma.productRequest.create({
        data: {
          requestId,
          requestType: "edit",
          status: "Pending",
          adminAction: true,
          isLongSet: true,
          userId: user.id,
          productId: existingProduct.product.id, // Use the base product ID instead of longSetProduct ID
          details: {
            create: {
              name: updateData.name,
              sku: updateData.sku,
              description: updateData.description || "",
              category: updateData.category,
              material: updateData.material,
              price: updateData.price,
              costPrice: updateData.costPrice,
              stock: updateData.stock,
              imageUrl: updateData.imageUrl,
              longSetParts: JSON.stringify(updateData.parts),
            },
          },
        },
        include: {
          details: true,
        },
      });

      return NextResponse.json(productRequest, { status: 200 });
    }

    // For non-admin users, create an edit request
    const requestId = await generateRequestId();

    const productRequest = await prisma.productRequest.create({
      data: {
        requestId,        requestType: "edit",
        status: "Pending",
        adminAction: false,
        isLongSet: true,
        userId: user.id,
        productId: existingProduct.product.id, // Use base product ID
        details: {
          create: {
            name: updateData.name,
            sku: updateData.sku,
            description: updateData.description || "",
            category: updateData.category,
            material: updateData.material,
            price: updateData.price,
            costPrice: updateData.costPrice,
            stock: updateData.stock,
            imageUrl: updateData.imageUrl,
            longSetParts: JSON.stringify(updateData.parts)
          },
        },
      },
      include: {
        details: true,
      },
    });

    return NextResponse.json(productRequest, { status: 200 });
  } catch (error: any) {
    console.error("Error updating long set product:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update product" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userInfo = await clerkClient.users.getUser(user.id);
    const userRole = userInfo.publicMetadata.role as string || "user";

    // Get the existing product
    const existingProduct = await prisma.longSetProduct.findUnique({
      where: { id: params.id },
      include: {
        product: true,
      },
    });

    if (!existingProduct) {
      return NextResponse.json(
        { error: "Long set product not found" },
        { status: 404 }
      );
    }    // Check if product relationship exists
    if (!existingProduct.product) {
      return NextResponse.json(
        { error: "Base product reference not found" },
        { status: 400 }
      );
    }

    // For admin actions, create a product request instead of direct deletion
    if (userRole === "admin") {
      const requestId = await generateRequestId();

      const productRequest = await prisma.productRequest.create({
        data: {
          requestId,
          requestType: "delete",
          status: "Pending",
          adminAction: true,
          isLongSet: true,
          userId: user.id,
          productId: existingProduct.product.id, // Use base product ID
          details: {
            create: {
              name: existingProduct.name,
              sku: existingProduct.sku,
              description: existingProduct.description || "",
              category: existingProduct.category,
              material: existingProduct.material,
              price: existingProduct.price,
              costPrice: existingProduct.costPrice,
              stock: existingProduct.stock,
              imageUrl: existingProduct.imageUrl,
            },
          },
        },
        include: {
          details: true,
        },
      });

      return NextResponse.json(productRequest, { status: 200 });
    }

    // For non-admin users, create a delete request
    const requestId = await generateRequestId();

    const productRequest = await prisma.productRequest.create({
      data: {
        requestId,        requestType: "delete",
        status: "Pending",
        adminAction: false,
        isLongSet: true,
        userId: user.id,
        productId: existingProduct.product.id, // Use base product ID
        details: {
          create: {
            name: existingProduct.name,
            sku: existingProduct.sku,
            description: existingProduct.description || "",
            category: existingProduct.category,
            material: existingProduct.material,
            price: existingProduct.price,
            costPrice: existingProduct.costPrice,
            stock: existingProduct.stock,
            imageUrl: existingProduct.imageUrl,
          },
        },
      },
      include: {
        details: true,
      },
    });

    return NextResponse.json(productRequest, { status: 200 });
  } catch (error: any) {
    console.error("Error deleting long set product:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete product" },
      { status: 500 }
    );
  }
}
