import { v2 as cloudinary } from "cloudinary";
import { type NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

// Configure Cloudinary with environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: NextRequest) {
  try {
    // Check if Cloudinary credentials are configured
    if (
      !process.env.CLOUDINARY_CLOUD_NAME ||
      !process.env.CLOUDINARY_API_KEY ||
      !process.env.CLOUDINARY_API_SECRET
    ) {
      console.error("Missing Cloudinary environment variables");
      return NextResponse.json(
        {
          error:
            "Server misconfiguration: Cloudinary credentials not configured. Please add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET to your environment variables.",
        },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const isImage = file.type.startsWith("image/");
    const isPdf = file.type === "application/pdf";

    // Validate file type
    if (!isImage && !isPdf) {
      return NextResponse.json(
        { error: "File must be an image or PDF" },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB for images, 20MB for PDFs)
    const maxSize = isPdf ? 20 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        {
          error: isPdf
            ? "PDF size must be less than 20MB"
            : "Image size must be less than 5MB",
        },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const buffer = await file.arrayBuffer();
    const bytes = Buffer.from(buffer);

    // Upload to Cloudinary
    const result = await new Promise<any>((resolve, reject) => {
      const upload = cloudinary.uploader.upload_stream(
        {
          resource_type: isPdf ? "raw" : "auto",
          folder: "order-checks",
        },
        (error, result) => {
          if (error) {
            console.error("Cloudinary upload error:", error);
            reject(error);
          } else {
            resolve(result);
          }
        }
      );

      upload.end(bytes);
    });

    return NextResponse.json({ url: result.secure_url });
  } catch (error) {
    console.error("Upload error:", error);

    const message =
      error instanceof Error ? error.message : "Failed to upload file";

    return NextResponse.json(
      {
        error: message,
        debug:
          process.env.NODE_ENV === "development"
            ? {
                name: error instanceof Error ? error.name : "Unknown",
                message: error instanceof Error ? error.message : String(error),
              }
            : undefined,
      },
      { status: 500 }
    );
  }
}
