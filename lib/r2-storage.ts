import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

const S3 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME || "books-pdf";
const PUBLIC_URL = process.env.R2_PUBLIC_URL || "";

/**
 * Upload a file to Cloudflare R2
 */
export async function uploadFile(
  key: string,
  body: Buffer | Uint8Array,
  contentType: string
): Promise<string> {
  await S3.send(
    new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );

  return getPublicUrl(key);
}

/**
 * Delete a file from Cloudflare R2
 */
export async function deleteFile(key: string): Promise<void> {
  await S3.send(
    new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    })
  );
}

/**
 * Get the public URL for a file in R2
 */
export function getPublicUrl(key: string): string {
  return `${PUBLIC_URL}/${key}`;
}

/**
 * Extract the R2 key from a public URL
 */
export function getKeyFromUrl(url: string): string | null {
  if (!url || !PUBLIC_URL) return null;
  if (url.startsWith(PUBLIC_URL)) {
    return url.slice(PUBLIC_URL.length + 1); // +1 for the trailing slash
  }
  // Fallback: extract filename from the URL
  const parts = url.split("/");
  return parts[parts.length - 1] || null;
}
