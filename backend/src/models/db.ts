import { v4 as uuid } from "uuid";
import dotenv from "dotenv";
dotenv.config();

// ── Types ─────────────────────────────────────────────────────────────────────
interface NoteRow {
  id: string;
  title: string;
  description: string;
  subject: string;
  tags: string[];
  uploader_wallet: string;
  file_hash: string;
  ipfs_url: string;
  tx_hash: string | null;
  file_size: number;
  file_name: string;
  created_at: string;
}

interface NoteFilter {
  page?: number;
  limit?: number;
  subject?: string;
  search?: string;
}

// ── In-memory store (used when DATABASE_URL is not set) ───────────────────────
const memStore: NoteRow[] = [];

// ── Pool (only loaded if DATABASE_URL is set) ─────────────────────────────────
let pg: typeof import("pg") | null = null;

async function getPool() {
  if (!process.env.DATABASE_URL) return null;
  if (!pg) pg = await import("pg");
  const { Pool } = pg;
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  return pool;
}

// ── Schema init ───────────────────────────────────────────────────────────────
export async function initDb() {
  const pool = await getPool();
  if (!pool) {
    console.log("ℹ️  No DATABASE_URL — using in-memory store");
    return;
  }
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        wallet_address TEXT PRIMARY KEY,
        username       TEXT,
        profile_image  TEXT,
        created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS notes (
        id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title          TEXT NOT NULL,
        description    TEXT,
        subject        TEXT NOT NULL,
        tags           TEXT[] DEFAULT '{}',
        uploader_wallet TEXT NOT NULL,
        file_hash      TEXT NOT NULL UNIQUE,
        ipfs_url       TEXT NOT NULL,
        tx_hash        TEXT,
        file_size      BIGINT,
        file_name      TEXT,
        created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS notes_subject_idx   ON notes(subject);
      CREATE INDEX IF NOT EXISTS notes_created_at_idx ON notes(created_at DESC);
      CREATE INDEX IF NOT EXISTS notes_file_hash_idx  ON notes(file_hash);
    `);
    console.log("✅ PostgreSQL schema initialized");
  } finally {
    client.release();
  }
}

// ── CRUD helpers ──────────────────────────────────────────────────────────────
export async function dbInsertNote(data: Omit<NoteRow, "id" | "created_at">): Promise<NoteRow> {
  const pool = await getPool();
  if (pool) {
    const { rows } = await pool.query(
      `INSERT INTO notes (title,description,subject,tags,uploader_wallet,file_hash,ipfs_url,tx_hash,file_size,file_name)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [data.title, data.description, data.subject, data.tags, data.uploader_wallet,
       data.file_hash, data.ipfs_url, data.tx_hash, data.file_size, data.file_name]
    );
    return rows[0];
  }
  const row: NoteRow = { ...data, id: uuid(), created_at: new Date().toISOString() };
  memStore.unshift(row);
  return row;
}

export async function dbFindNoteByHash(hash: string): Promise<NoteRow | null> {
  const pool = await getPool();
  if (pool) {
    const { rows } = await pool.query("SELECT * FROM notes WHERE file_hash = $1", [hash]);
    return rows[0] || null;
  }
  return memStore.find((n) => n.file_hash === hash) || null;
}

export async function dbFindNoteById(id: string): Promise<NoteRow | null> {
  const pool = await getPool();
  if (pool) {
    const { rows } = await pool.query("SELECT * FROM notes WHERE id = $1", [id]);
    return rows[0] || null;
  }
  return memStore.find((n) => n.id === id) || null;
}

export async function dbListNotes(
  filter: NoteFilter
): Promise<{ notes: NoteRow[]; total: number }> {
  const { page = 1, limit = 12, subject, search } = filter;

  const pool = await getPool();
  if (pool) {
    const conditions: string[] = [];
    const params: unknown[] = [];
    let i = 1;
    if (subject) { conditions.push(`subject ILIKE $${i++}`); params.push(`%${subject}%`); }
    if (search)  { conditions.push(`(title ILIKE $${i++} OR description ILIKE $${i++})`); params.push(`%${search}%`, `%${search}%`); }
    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const countRes = await pool.query(`SELECT COUNT(*) FROM notes ${where}`, params);
    const total = parseInt(countRes.rows[0].count);
    params.push(limit, (page - 1) * limit);
    const { rows } = await pool.query(
      `SELECT * FROM notes ${where} ORDER BY created_at DESC LIMIT $${i++} OFFSET $${i}`,
      params
    );
    return { notes: rows, total };
  }

  // In-memory filtering
  let filtered = [...memStore];
  if (subject) filtered = filtered.filter((n) => n.subject.toLowerCase().includes(subject.toLowerCase()));
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter((n) => n.title.toLowerCase().includes(q) || n.description?.toLowerCase().includes(q));
  }
  const total = filtered.length;
  const offset = (page - 1) * limit;
  return { notes: filtered.slice(offset, offset + limit), total };
}
