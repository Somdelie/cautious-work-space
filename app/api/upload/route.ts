import { v2 as cloudinary } from "cloudinary";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;

// Basic presence checks to help debugging in deployed envs
if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
  console.error("Cloudinary environment variables missing or incomplete:", {
    hasCloudName: !!CLOUDINARY_CLOUD_NAME,
    hasApiKey: !!CLOUDINARY_API_KEY,
    hasApiSecret: !!CLOUDINARY_API_SECRET,
  });
}

cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
});

export async function POST(request: NextRequest) {
  try {
    // Fail fast if Cloudinary credentials are missing in the deployed environment
    if (
      !CLOUDINARY_CLOUD_NAME ||
      !CLOUDINARY_API_KEY ||
      !CLOUDINARY_API_SECRET
    ) {
      const msg =
        "Server misconfiguration: missing Cloudinary environment variables";
      console.error(msg);
      return NextResponse.json({ error: msg }, { status: 500 });
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

    const buffer = await file.arrayBuffer();
    const bytes = Buffer.from(buffer);

    const result = (await new Promise((resolve, reject) => {
      const upload = cloudinary.uploader.upload_stream(
        {
          resource_type: isPdf ? "raw" : "auto",
          folder: "order-checks",
        },
        (error, result) => {
          if (error) {
            try {
              console.error(
                "Cloudinary upload callback error:",
                JSON.stringify(
                  Object.getOwnPropertyNames(error).reduce(
                    (acc, k) => ({ ...acc, [k]: error[k] }),
                    {}
                  ),
                  null,
                  2
                )
              );
            } catch (e) {
              console.error(
                "Cloudinary upload callback error (stringify failed):",
                error
              );
            }
            reject(error);
          } else resolve(result);
        }
      );

      upload.end(bytes);
    })) as any;

    console.log("Cloudinary upload result:", result);

    return NextResponse.json({ url: result.secure_url });
  } catch (error) {
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
