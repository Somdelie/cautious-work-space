import { v2 as cloudinary } from "cloudinary";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

// Temporary hardcoded for testing on Vercel
const CLOUDINARY_CLOUD_NAME = "cautious";
const CLOUDINARY_API_KEY = "418346945468562";
const CLOUDINARY_API_SECRET = "x2RTKvgYx-RDoh5A2ac0thFqwz8";

// Basic presence checks to help debugging in deployed envs
console.log("Upload route initialized - checking Cloudinary config", {
  hasCloudName: !!CLOUDINARY_CLOUD_NAME,
  hasApiKey: !!CLOUDINARY_API_KEY,
  hasApiSecret: !!CLOUDINARY_API_SECRET,
  environment: process.env.NODE_ENV,
});

if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
  console.error("Cloudinary environment variables missing or incomplete:", {
    hasCloudName: !!CLOUDINARY_CLOUD_NAME,
    hasApiKey: !!CLOUDINARY_API_KEY,
    hasApiSecret: !!CLOUDINARY_API_SECRET,
  });
}

try {
  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
  });
  console.log("Cloudinary configured successfully");
} catch (configError) {
  console.error("Failed to configure Cloudinary:", configError);
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  console.log(`[${new Date().toISOString()}] Upload request received`);

  try {
    // Fail fast if Cloudinary credentials are missing in the deployed environment
    if (
      !CLOUDINARY_CLOUD_NAME ||
      !CLOUDINARY_API_KEY ||
      !CLOUDINARY_API_SECRET
    ) {
      const msg =
        "Server misconfiguration: missing Cloudinary environment variables";
      console.error("Upload endpoint called with missing Cloudinary config:", {
        hasCloudName: !!CLOUDINARY_CLOUD_NAME,
        hasApiKey: !!CLOUDINARY_API_KEY,
        hasApiSecret: !!CLOUDINARY_API_SECRET,
      });
      return NextResponse.json({ error: msg }, { status: 500 });
    }

    console.log("Processing form data...");
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    console.log(
      `File received: ${file.name}, size: ${file.size}, type: ${file.type}`
    );

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

    console.log("Converting file to buffer...");
    const buffer = await file.arrayBuffer();
    const bytes = Buffer.from(buffer);
    console.log(`Buffer size: ${bytes.length}`);

    console.log("Starting Cloudinary upload...");
    // Use buffer-based upload instead of stream for better Vercel compatibility
    const result = await cloudinary.uploader.upload(
      `data:${file.type};base64,${bytes.toString("base64")}`,
      {
        resource_type: isPdf ? "raw" : "auto",
        folder: "order-checks",
      }
    );

    console.log("Cloudinary upload result:", result);

    const duration = Date.now() - startTime;
    console.log(`Upload completed successfully in ${duration}ms`);
    return NextResponse.json({ url: result.secure_url });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`Upload failed after ${duration}ms`);

    // Log full error server-side for debugging and return comprehensive error info
    console.error("Upload error (full):", error);

    let message = "Failed to upload file";
    const debugInfo: Record<string, unknown> = {};

    if (error instanceof Error) {
      message = error.message || message;
      debugInfo.name = error.name;
      debugInfo.message = error.message;
      debugInfo.stack = error.stack;
      // @ts-ignore
      debugInfo.http_code = error.http_code;
    } else if (typeof error === "object" && error !== null) {
      try {
        // Capture all enumerable properties
        for (const key of Object.getOwnPropertyNames(error)) {
          try {
            // @ts-ignore
            debugInfo[key] = error[key];
          } catch {
            // skip if property can't be accessed
          }
        }
        // @ts-ignore
        if (error.message) message = String(error.message);
      } catch (e) {
        debugInfo.stringifyError = String(error);
      }
    } else {
      message = String(error) || message;
    }

    const payload: Record<string, unknown> = {
      error: message,
      debug: debugInfo,
    };

    return NextResponse.json(payload, { status: 500 });
  }
}
