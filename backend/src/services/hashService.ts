import crypto from "crypto";

/**
 * Generate a SHA256 hex digest from a Buffer.
 */
export function generateSHA256(buffer: Buffer): string {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}
