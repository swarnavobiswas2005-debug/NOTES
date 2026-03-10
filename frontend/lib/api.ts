const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

// ── Note (global) ─────────────────────────────────────────────────────────────
export interface Note {
  id: string;
  title: string;
  subject: string;
  chapter_name: string;
  topic_name: string;
  chapter_number: number;
  uploader_name: string;
  description: string;
  tags: string[];
  uploader_wallet: string;
  file_hash: string;
  ipfs_url: string;
  tx_hash: string;
  file_size: number;
  file_name: string;
  created_at: string;
  onChain?: { uploader: string; timestamp: number } | null;
}

export interface NotesResponse {
  notes: Note[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface UploadResponse {
  noteId: string;
  fileHash: string;
  ipfsUrl: string;
  txHash: string;
}

export interface VerifyResponse {
  verified: boolean;
  fileHash: string;
  inDatabase: boolean;
  onChain: boolean;
  note: Partial<Note> | null;
}

// ── Room (client-side / localStorage) ────────────────────────────────────────
export interface Room {
  code: string;
  name: string;
  created_at: string;
  notes: RoomNote[];
}

export interface RoomNote {
  id: string;
  title: string;
  subject: string;
  chapter_name: string;
  topic_name: string;
  chapter_number: number;
  uploader_name: string;
  uploader_wallet: string;
  file_name: string;
  file_size: number;
  file_hash: string;
  room_code: string;
  created_at: string;
}

// ── Room helpers (localStorage) ───────────────────────────────────────────────
const ROOMS_KEY = "notes_rooms";

function getRooms(): Record<string, Room> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(ROOMS_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveRooms(rooms: Record<string, Room>) {
  localStorage.setItem(ROOMS_KEY, JSON.stringify(rooms));
}

/** Generate a random 6-char alphanumeric code */
export function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

export function createRoom(name: string): Room {
  const rooms = getRooms();
  const code = generateRoomCode();
  const room: Room = { code, name, created_at: new Date().toISOString(), notes: [] };
  rooms[code] = room;
  saveRooms(rooms);
  return room;
}

export function joinRoom(code: string): Room | null {
  const rooms = getRooms();
  return rooms[code.toUpperCase()] ?? null;
}

export function getRoom(code: string): Room | null {
  return joinRoom(code);
}

export function addNoteToRoom(code: string, note: RoomNote): void {
  const rooms = getRooms();
  if (!rooms[code]) return;
  rooms[code].notes.unshift(note);
  saveRooms(rooms);
}

export function searchRoomNotes(
  code: string,
  query: string,
  searchType: "title" | "topic" | "uploader" = "title"
): RoomNote[] {
  const room = getRoom(code);
  if (!room) return [];
  const q = query.toLowerCase();
  if (!q) return room.notes;
  return room.notes.filter((n) => {
    if (searchType === "topic") return n.topic_name.toLowerCase().includes(q) || n.chapter_name.toLowerCase().includes(q);
    if (searchType === "uploader") return n.uploader_name.toLowerCase().includes(q) || n.uploader_wallet.toLowerCase().includes(q);
    return n.title.toLowerCase().includes(q) || n.subject.toLowerCase().includes(q);
  });
}

// ── Global API calls ──────────────────────────────────────────────────────────
export async function fetchNotes(params: {
  page?: number;
  limit?: number;
  subject?: string;
  search?: string;
  search_type?: "title" | "topic" | "uploader";
}): Promise<NotesResponse> {
  const qs = new URLSearchParams();
  if (params.page) qs.set("page", String(params.page));
  if (params.limit) qs.set("limit", String(params.limit));
  if (params.subject) qs.set("subject", params.subject);
  if (params.search) qs.set("search", params.search);
  if (params.search_type) qs.set("search_type", params.search_type);

  const res = await fetch(`${API}/api/notes?${qs.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch notes");
  return res.json();
}

export async function fetchNote(id: string): Promise<Note> {
  const res = await fetch(`${API}/api/notes/${id}`);
  if (!res.ok) throw new Error("Note not found");
  return res.json();
}

export async function uploadNote(formData: FormData): Promise<UploadResponse> {
  const res = await fetch(`${API}/api/upload`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Upload failed");
  }
  return res.json();
}

export async function verifyNote(file: File): Promise<VerifyResponse> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch(`${API}/api/verify`, { method: "POST", body: fd });
  if (!res.ok) throw new Error("Verification failed");
  return res.json();
}

export function formatBytes(bytes: number): string {
  if (!bytes) return "—";
  const units = ["B", "KB", "MB", "GB"];
  let i = 0;
  let val = bytes;
  while (val >= 1024 && i < units.length - 1) { val /= 1024; i++; }
  return `${val.toFixed(1)} ${units[i]}`;
}

export function truncateAddress(addr: string): string {
  if (!addr || addr.length < 10) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric",
  });
}

export const SUBJECTS = [
  "Mathematics", "Physics", "Chemistry", "Biology",
  "Computer Science", "Engineering", "Economics",
  "History", "Literature", "Philosophy", "Other",
];
