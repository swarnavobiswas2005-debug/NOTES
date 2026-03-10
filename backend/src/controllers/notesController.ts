import { Request, Response } from "express";
import { generateSHA256 } from "../services/hashService";
import { pinFileToIPFS } from "../services/pinataService";
import { registerNoteOnChain, verifyNoteOnChain, getNoteFromChain } from "../services/blockchainService";
import { dbInsertNote, dbFindNoteByHash, dbFindNoteById, dbListNotes } from "../models/db";

// ── POST /api/upload ──────────────────────────────────────────────────────────
export async function uploadNote(req: Request, res: Response) {
  try {
    if (!req.file) return res.status(400).json({ error: "No file provided" });

    const { title, subject, description, tags, uploader_wallet } = req.body;
    const fileBuffer = req.file.buffer;
    const fileName = req.file.originalname;

    // 1. Generate SHA256 hash
    const fileHash = generateSHA256(fileBuffer);

    // 2. Check for duplicate
    const existing = await dbFindNoteByHash(fileHash);
    if (existing) {
      return res.status(409).json({ error: "This note has already been uploaded.", noteId: existing.id });
    }

    // 3. Upload to IPFS
    const { url: ipfsUrl } = await pinFileToIPFS(fileBuffer, fileName);

    // 4. Register hash on blockchain
    const txHash = await registerNoteOnChain(fileHash);

    // 5. Save to DB / memory
    const tagsArray = tags
      ? tags.split(",").map((t: string) => t.trim()).filter(Boolean)
      : [];

    const note = await dbInsertNote({
      title,
      description: description || "",
      subject,
      tags: tagsArray,
      uploader_wallet,
      file_hash: fileHash,
      ipfs_url: ipfsUrl,
      tx_hash: txHash,
      file_size: req.file.size,
      file_name: fileName,
    });

    res.status(201).json({
      noteId: note.id,
      fileHash: note.file_hash,
      ipfsUrl: note.ipfs_url,
      txHash: note.tx_hash,
    });
  } catch (err: any) {
    console.error("[uploadNote]", err);
    res.status(500).json({ error: err.message });
  }
}

// ── GET /api/notes ────────────────────────────────────────────────────────────
export async function getNotes(req: Request, res: Response) {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, parseInt(req.query.limit as string) || 12);
    const subject = req.query.subject as string | undefined;
    const search = req.query.search as string | undefined;

    const { notes, total } = await dbListNotes({ page, limit, subject, search });
    res.json({ notes, total, page, limit, pages: Math.ceil(total / limit) });
  } catch (err: any) {
    console.error("[getNotes]", err);
    res.status(500).json({ error: err.message });
  }
}

// ── GET /api/notes/:id ────────────────────────────────────────────────────────
export async function getNoteById(req: Request, res: Response) {
  try {
    const note = await dbFindNoteById(req.params.id);
    if (!note) return res.status(404).json({ error: "Note not found" });

    const onChain = await getNoteFromChain(note.file_hash);
    res.json({ ...note, onChain });
  } catch (err: any) {
    console.error("[getNoteById]", err);
    res.status(500).json({ error: err.message });
  }
}

// ── POST /api/verify ──────────────────────────────────────────────────────────
export async function verifyNote(req: Request, res: Response) {
  try {
    if (!req.file) return res.status(400).json({ error: "No file provided" });

    const fileHash = generateSHA256(req.file.buffer);

    const dbNote = await dbFindNoteByHash(fileHash);
    const inDatabase = !!dbNote;
    const onChain = await verifyNoteOnChain(fileHash);
    const verified = inDatabase || onChain;

    res.json({
      verified,
      fileHash,
      inDatabase,
      onChain,
      note: dbNote || null,
    });
  } catch (err: any) {
    console.error("[verifyNote]", err);
    res.status(500).json({ error: err.message });
  }
}
