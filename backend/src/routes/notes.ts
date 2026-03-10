import { Router } from "express";
import { upload } from "../middleware/upload";
import { validateUpload } from "../middleware/validate";
import {
  uploadNote,
  getNotes,
  getNoteById,
  verifyNote,
} from "../controllers/notesController";

export const notesRouter = Router();

// Upload a new note
notesRouter.post("/upload", upload.single("file"), validateUpload, uploadNote);

// List notes (paginated, filterable, searchable)
notesRouter.get("/notes", getNotes);

// Get a single note by ID
notesRouter.get("/notes/:id", getNoteById);

// Verify a file's authenticity
notesRouter.post("/verify", upload.single("file"), verifyNote);
