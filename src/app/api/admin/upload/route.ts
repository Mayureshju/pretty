import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { s3Client, S3_BUCKET, getS3Url } from "@/lib/s3";
import {
  requireAdmin,
  handleAuthError,
  errorResponse,
} from "@/lib/auth";

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
    const allowedFolders = ["products", "banners", "categories"];
    const safeFolder = allowedFolders.includes(folder) ? folder : "products";

    const sanitizedName = file.name
      .replace(/[^a-zA-Z0-9._-]/g, "-")
      .toLowerCase();
    const key = `${safeFolder}/${Date.now()}-${sanitizedName}`;

    const buffer = Buffer.from(await file.arrayBuffer());

    await s3Client.send(
      new PutObjectCommand({
        Bucket: S3_BUCKET,
        Key: key,
        Body: buffer,
        ContentType: file.type,
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

    const validPrefixes = ["products/", "banners/", "categories/"];
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
