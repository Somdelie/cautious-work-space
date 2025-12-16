import { put } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
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

    const blob = await put(file.name, file, {
      access: "public",
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    return NextResponse.json({ url: blob.url });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}



