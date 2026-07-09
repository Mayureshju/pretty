import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import sharp from "sharp";
import { s3Client, S3_BUCKET, getS3Url } from "@/lib/s3";
import {
  requireAdmin,
  handleAuthError,
  errorResponse,
} from "@/lib/auth";

// Pass-through formats sharp shouldn't rasterize (vectors / animations).
const PASSTHROUGH = ["image/svg+xml", "image/gif"];

// Longest edge we ever need on the storefront; keeps files small + fast.
const MAX_EDGE = 1600;

export async function POST(request: Request) {
  try {
    await requireAdmin();
  } catch (err) {
    return handleAuthError(err);
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return errorResponse("No file provided", 400);
    }

    if (!file.type.startsWith("image/")) {
      return errorResponse("File must be an image", 400);
    }

    if (file.size > 5 * 1024 * 1024) {
      return errorResponse("File size must be under 5MB", 400);
    }

    const folder = (formData.get("folder") as string) || "products";
    const allowedFolders = ["products", "banners", "categories", "blogs"];
    const safeFolder = allowedFolders.includes(folder) ? folder : "products";

    const sanitizedName = file.name
      .replace(/[^a-zA-Z0-9._-]/g, "-")
      .replace(/\.[a-z0-9]+$/i, "")
      .toLowerCase();

    const rawBuffer = Buffer.from(await file.arrayBuffer());

    let body: Buffer = rawBuffer;
    let contentType = file.type;
    let ext = (file.name.match(/\.[a-z0-9]+$/i)?.[0] || "").toLowerCase();

    // Compress + normalize raster images so we never store oversized/distorted
    // originals. Vectors and GIFs are passed through untouched.
    if (!PASSTHROUGH.includes(file.type)) {
      try {
        body = await sharp(rawBuffer)
          .rotate() // respect EXIF orientation (prevents "sideways" distortion)
          .resize({
            width: MAX_EDGE,
            height: MAX_EDGE,
            fit: "inside",
            withoutEnlargement: true,
          })
          .webp({ quality: 82 })
          .toBuffer();
        contentType = "image/webp";
        ext = ".webp";
      } catch (e) {
        // If sharp can't decode it, fall back to the original bytes.
        console.error("[upload] sharp compression failed, storing raw:", e);
        body = rawBuffer;
        contentType = file.type;
      }
    }

    const key = `${safeFolder}/${Date.now()}-${sanitizedName}${ext}`;

    await s3Client.send(
      new PutObjectCommand({
        Bucket: S3_BUCKET,
        Key: key,
        Body: body,
        ContentType: contentType,
        CacheControl: "public, max-age=31536000, immutable",
      })
    );

    const url = getS3Url(key);

    return Response.json({ url, key });
  } catch (err) {
    console.error("Upload error:", err);
    return errorResponse("Failed to upload image");
  }
}

export async function DELETE(request: Request) {
  try {
    await requireAdmin();
  } catch (err) {
    return handleAuthError(err);
  }

  try {
    const { key } = await request.json();

    if (!key || typeof key !== "string") {
      return errorResponse("Invalid key", 400);
    }

    const validPrefixes = ["products/", "banners/", "categories/", "blogs/"];
    if (!validPrefixes.some((p) => key.startsWith(p))) {
      return errorResponse("Invalid key prefix", 400);
    }

    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: S3_BUCKET,
        Key: key,
      })
    );

    return Response.json({ success: true });
  } catch (err) {
    console.error("Delete error:", err);
    return errorResponse("Failed to delete image");
  }
}
