import { z } from "zod";
import { Request, Response, NextFunction } from "express";

export const uploadSchema = z.object({
  title: z.string().min(3).max(200),
  subject: z.string().min(2).max(100),
  description: z.string().max(2000).optional(),
  tags: z.string().optional(), // comma-separated string from form data
  uploader_wallet: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address"),
});

export function validateUpload(req: Request, res: Response, next: NextFunction) {
  const result = uploadSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: "Validation failed", details: result.error.flatten() });
  }
  next();
}
