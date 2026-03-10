import PinataSDK from "@pinata/sdk";
import { Readable } from "stream";
import dotenv from "dotenv";
dotenv.config();

const pinata = new PinataSDK(
  process.env.PINATA_API_KEY || "",
  process.env.PINATA_SECRET_API_KEY || ""
);

const GATEWAY = process.env.PINATA_GATEWAY || "https://gateway.pinata.cloud/ipfs/";

export interface PinataResult {
  cid: string;
  url: string;
}

/**
 * Pin a file buffer to IPFS via Pinata.
 * Falls back to a mock URL when PINATA_API_KEY is not set (local dev).
 */
export async function pinFileToIPFS(
  buffer: Buffer,
  fileName: string
): Promise<PinataResult> {
  // ── Local dev fallback ───────────────────────────────────────────────────
  if (!process.env.PINATA_API_KEY) {
    const mockCid = "Qm" + Buffer.from(fileName + Date.now()).toString("hex").slice(0, 44);
    console.warn("[Pinata] No API key set — using mock IPFS CID:", mockCid);
    return { cid: mockCid, url: `${GATEWAY}${mockCid}` };
  }

  // ── Real Pinata upload ───────────────────────────────────────────────────
  const stream = Readable.from(buffer);
  (stream as any).path = fileName; // Pinata SDK requires .path on the stream

  const result = await pinata.pinFileToIPFS(stream, {
    pinataMetadata: { name: fileName },
    pinataOptions: { cidVersion: 1 },
  });

  return {
    cid: result.IpfsHash,
    url: `${GATEWAY}${result.IpfsHash}`,
  };
}
