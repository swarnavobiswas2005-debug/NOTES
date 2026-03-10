"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { AuthModal } from "@/components/AuthModal";
import {
  getRoom,
  addNoteToRoom,
  searchRoomNotes,
  SUBJECTS,
  Room,
  RoomNote,
  formatBytes,
  formatDate,
} from "@/lib/api";
import { UploadProgress } from "@/components/UploadProgress";
import {
  CloudArrowUpIcon,
  DocumentIcon,
  MagnifyingGlassIcon,
  ClipboardDocumentIcon,
  CheckIcon,
  ArrowLeftIcon,
  ExclamationTriangleIcon,
  BookOpenIcon,
} from "@heroicons/react/24/outline";

type Tab = "notes" | "upload";
type SearchType = "title" | "topic" | "uploader";

// ── Tiny "copy code" badge ────────────────────────────────────────────────────
function CodeBadge({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={copy}
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-brand-500/15 border border-brand-500/30 text-brand-300 text-sm font-mono font-semibold hover:bg-brand-500/25 transition-all"
    >
      {copied ? <CheckIcon className="w-3.5 h-3.5 text-green-400" /> : <ClipboardDocumentIcon className="w-3.5 h-3.5" />}
      {code}
      <span className="text-white/30 font-sans font-normal text-xs">{copied ? "Copied!" : "Copy"}</span>
    </button>
  );
}

// ── Room note card ────────────────────────────────────────────────────────────
function RoomNoteCard({ note, index }: { note: RoomNote; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className="glass-card p-5 flex flex-col gap-3 hover:border-white/20 transition-all"
    >
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-red-500/15 flex items-center justify-center flex-shrink-0 mt-0.5">
          <DocumentIcon className="w-4.5 h-4.5 text-red-400" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-white font-semibold text-sm leading-snug truncate">{note.title}</p>
          <p className="text-white/40 text-xs mt-0.5">{note.subject}</p>
        </div>
      </div>

      {/* Chapter / Topic badges */}
      <div className="flex flex-wrap gap-1.5">
        <span className="badge bg-brand-500/10 text-brand-300 border border-brand-500/20">
          Ch.{note.chapter_number} · {note.chapter_name}
        </span>
        <span className="badge bg-purple-500/10 text-purple-300 border border-purple-500/20">
          {note.topic_name}
        </span>
      </div>

      <div className="border-t border-white/5 pt-3 flex items-center justify-between text-xs text-white/30">
        <span>{note.uploader_name || note.uploader_wallet.slice(0, 6) + "..."}</span>
        <span>{formatDate(note.created_at)}</span>
      </div>

      <div className="flex items-center justify-between text-xs text-white/30">
        <span>{note.file_name}</span>
        <span>{formatBytes(note.file_size)}</span>
      </div>
    </motion.div>
  );
}

// ── Main room page ────────────────────────────────────────────────────────────
export default function RoomInteriorPage() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  const { walletAddress, username, isWalletConnected, isPasswordSession, isGhostSession } = useAuth();
  const isAuthed = isWalletConnected || isPasswordSession || isGhostSession;
  const [showAuthModal, setShowAuthModal] = useState(false);

  const [room, setRoom] = useState<Room | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [tab, setTab] = useState<Tab>("notes");

  // Search
  const [search, setSearch] = useState("");
  const [searchType, setSearchType] = useState<SearchType>("title");
  const [results, setResults] = useState<RoomNote[]>([]);

  // Upload form
  const [form, setForm] = useState({
    title: "",
    subject: SUBJECTS[0],
    chapter_name: "",
    topic_name: "",
    chapter_number: "",
    uploader_name: "",
  });
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progressStep, setProgressStep] = useState(-1);
  const [uploadDone, setUploadDone] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Load room
  useEffect(() => {
    const r = getRoom(code?.toUpperCase() ?? "");
    if (!r) { setNotFound(true); return; }
    setRoom(r);
    setResults(r.notes);
  }, [code]);

  // Live search
  useEffect(() => {
    if (!room) return;
    const filtered = searchRoomNotes(room.code, search, searchType);
    setResults(filtered);
  }, [search, searchType, room]);

  const refreshRoom = () => {
    const r = getRoom(code?.toUpperCase() ?? "");
    if (r) { setRoom(r); setResults(searchRoomNotes(r.code, search, searchType)); }
  };

  const validateFile = (f: File) => {
    if (!f.name.toLowerCase().endsWith(".pdf")) { setFileError("Only PDF files accepted."); return false; }
    if (f.size > 30 * 1024 * 1024) { setFileError("Max 30 MB."); return false; }
    setFileError(null);
    return true;
  };

  const onFile = (f: File) => { if (validateFile(f)) setFile(f); else setFile(null); };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) onFile(f);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !room) return;
    setUploading(true); setFormError(null);

    try {
      // Simulate progress
      setProgressStep(0); await new Promise(r => setTimeout(r, 500));
      setProgressStep(1); await new Promise(r => setTimeout(r, 400));
      setProgressStep(2); await new Promise(r => setTimeout(r, 300));

      // Hash the file in-browser
      const buf = await file.arrayBuffer();
      const hashBuf = await crypto.subtle.digest("SHA-256", buf);
      const hashHex = Array.from(new Uint8Array(hashBuf)).map(b => b.toString(16).padStart(2, "0")).join("");

      const note: RoomNote = {
        id: `room-${Date.now()}`,
        title: form.title,
        subject: form.subject,
        chapter_name: form.chapter_name,
        topic_name: form.topic_name,
        chapter_number: Number(form.chapter_number),
        uploader_name: form.uploader_name,
        uploader_wallet: walletAddress ?? "",
        file_name: file.name,
        file_size: file.size,
        file_hash: hashHex,
        room_code: room.code,
        created_at: new Date().toISOString(),
      };

      setProgressStep(3); await new Promise(r => setTimeout(r, 300));
      addNoteToRoom(room.code, note);
      setProgressStep(4);
      setUploadDone(true);
      setUploading(false);
      refreshRoom();
    } catch {
      setFormError("Upload failed. Please try again.");
      setUploading(false);
    }
  };

  const resetUpload = () => {
    setUploadDone(false); setProgressStep(-1);
    setFile(null); setFileError(null);
    setForm({ title: "", subject: SUBJECTS[0], chapter_name: "", topic_name: "", chapter_number: "", uploader_name: "" });
    setTab("notes");
  };

  // ── Not found ──────────────────────────────────────────────────────────────
  if (notFound) {
    return (
      <div className="min-h-screen pt-24 pb-20 px-4 sm:px-6 flex items-center justify-center">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card p-12 text-center max-w-md mx-auto">
          <div className="text-5xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold text-white mb-3">Room Not Found</h1>
          <p className="text-white/50 mb-6 text-sm">No room exists with code <code className="text-brand-300 font-mono">{code}</code>. Check the code or create a new room.</p>
          <button onClick={() => router.push("/room")} className="btn-primary">← Back to Rooms</button>
        </motion.div>
      </div>
    );
  }

  if (!room) return null;

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 sm:px-6">
      <div className="container mx-auto max-w-5xl">

        {/* ── Room header ── */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <button onClick={() => router.push("/room")} className="flex items-center gap-1.5 text-white/40 hover:text-white/70 text-sm mb-5 transition-colors">
            <ArrowLeftIcon className="w-3.5 h-3.5" /> All Rooms
          </button>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-white/40 text-xs uppercase tracking-wider font-medium">Private Room</span>
              </div>
              <h1 className="text-3xl font-bold text-white">{room.name}</h1>
              <p className="text-white/40 text-sm mt-1">{room.notes.length} note{room.notes.length !== 1 ? "s" : ""} · Created {formatDate(room.created_at)}</p>
            </div>
            <CodeBadge code={room.code} />
          </div>
        </motion.div>

        {/* ── Tabs ── */}
        <div className="flex gap-1 p-1 rounded-xl bg-white/5 border border-white/10 w-fit mb-8">
          {(["notes", "upload"] as const).map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setUploadDone(false); }}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${tab === t ? "bg-brand-500 text-white shadow-lg" : "text-white/50 hover:text-white"}`}
            >
              {t === "notes" ? `📚 Notes (${room.notes.length})` : "⬆️ Upload"}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* ── Notes tab ── */}
          {tab === "notes" && (
            <motion.div key="notes" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {/* Search bar */}
              <div className="glass-card p-4 mb-6 flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input
                    className="input-field pl-11"
                    placeholder={`Search by ${searchType}...`}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                {/* Search type pills */}
                <div className="flex gap-1 p-1 rounded-lg bg-white/5 border border-white/10 self-start sm:self-auto">
                  {(["title", "topic", "uploader"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setSearchType(t)}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${searchType === t ? "bg-brand-500/60 text-white" : "text-white/40 hover:text-white/70"}`}
                    >
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {results.length === 0 ? (
                <div className="text-center py-20 text-white/30">
                  <BookOpenIcon className="w-12 h-12 mx-auto mb-4 opacity-30" />
                  <p className="text-lg font-medium">{search ? "No notes match your search" : "No notes yet"}</p>
                  <p className="text-sm mt-1">{search ? "Try different keywords" : "Upload the first note to this room"}</p>
                  {!search && (
                    <button onClick={() => setTab("upload")} className="btn-primary mt-6 inline-flex items-center gap-2">
                      <CloudArrowUpIcon className="w-4 h-4" /> Upload First Note
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {results.map((note, i) => (
                    <RoomNoteCard key={note.id} note={note} index={i} />
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* ── Upload tab ── */}
          {tab === "upload" && (
            <motion.div key="upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-w-2xl mx-auto">
              {!isAuthed ? (
                <div className="glass-card p-10 text-center">
                  <h2 className="text-xl font-semibold text-white mb-3">Sign In to Upload</h2>
                  <p className="text-white/50 mb-6 text-sm">Create an account or connect your wallet to upload notes to this room.</p>
                  <div className="flex justify-center">
                    <button onClick={() => setShowAuthModal(true)} className="btn-primary">Connect / Sign In</button>
                  </div>
                  {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
                </div>
              ) : uploading ? (
                <div className="glass-card p-8">
                  <h2 className="text-xl font-semibold text-white mb-6 text-center">Saving to Room...</h2>
                  <UploadProgress currentStep={progressStep} />
                </div>
              ) : uploadDone ? (
                <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="glass-card p-10 text-center">
                  <div className="text-5xl mb-4">🎉</div>
                  <h2 className="text-2xl font-bold text-white mb-2">Note Added!</h2>
                  <p className="text-white/50 mb-6 text-sm">Your note is now visible to everyone with room code <span className="text-brand-300 font-mono">{room.code}</span></p>
                  <div className="flex gap-3 justify-center">
                    <button onClick={resetUpload} className="btn-ghost">Upload Another</button>
                    <button onClick={() => { setTab("notes"); setUploadDone(false); }} className="btn-primary">View Notes</button>
                  </div>
                </motion.div>
              ) : (
                <form onSubmit={handleUpload} className="space-y-5">
                  {formError && (
                    <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm flex items-start gap-2">
                      <ExclamationTriangleIcon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      {formError}
                    </div>
                  )}

                  <div className="glass-card p-6 space-y-5">
                    <div>
                      <label className="block text-sm text-white/70 mb-1.5 font-medium">Your Name *</label>
                      <input className="input-field" placeholder="e.g. Rahul Singh" value={form.uploader_name} onChange={(e) => setForm(f => ({ ...f, uploader_name: e.target.value }))} required maxLength={80} />
                    </div>
                    <div>
                      <label className="block text-sm text-white/70 mb-1.5 font-medium">Note Title *</label>
                      <input className="input-field" placeholder="e.g. Integration Techniques Summary" value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} required minLength={3} maxLength={200} />
                    </div>
                    <div>
                      <label className="block text-sm text-white/70 mb-1.5 font-medium">Subject *</label>
                      <select className="input-field" value={form.subject} onChange={(e) => setForm(f => ({ ...f, subject: e.target.value }))} required>
                        {SUBJECTS.map(s => <option key={s} value={s} className="bg-surface-DEFAULT">{s}</option>)}
                      </select>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-white/70 mb-1.5 font-medium">Chapter No. *</label>
                        <input className="input-field" type="number" min={1} max={999} placeholder="e.g. 3" value={form.chapter_number} onChange={(e) => setForm(f => ({ ...f, chapter_number: e.target.value }))} required />
                      </div>
                      <div>
                        <label className="block text-sm text-white/70 mb-1.5 font-medium">Chapter Name *</label>
                        <input className="input-field" placeholder="e.g. Calculus III" value={form.chapter_name} onChange={(e) => setForm(f => ({ ...f, chapter_name: e.target.value }))} required maxLength={120} />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm text-white/70 mb-1.5 font-medium">Topic Name *</label>
                      <input className="input-field" placeholder="e.g. Integration by Parts" value={form.topic_name} onChange={(e) => setForm(f => ({ ...f, topic_name: e.target.value }))} required maxLength={120} />
                    </div>
                  </div>

                  {/* PDF drop zone */}
                  <div
                    role="button" tabIndex={0}
                    onClick={() => fileRef.current?.click()}
                    onKeyDown={(e) => e.key === "Enter" && fileRef.current?.click()}
                    onDrop={handleDrop}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    className={`glass-card p-10 text-center cursor-pointer transition-all duration-200 ${dragOver ? "border-brand-500/60 bg-brand-500/10" : "hover:border-white/20"}`}
                  >
                    <input ref={fileRef} type="file" className="hidden" accept=".pdf" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
                    {file ? (
                      <div className="flex items-center justify-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-red-500/20 flex items-center justify-center flex-shrink-0">
                          <DocumentIcon className="w-5 h-5 text-red-400" />
                        </div>
                        <div className="text-left">
                          <p className="text-white font-medium text-sm">{file.name}</p>
                          <p className="text-white/40 text-xs">{(file.size / 1024 / 1024).toFixed(2)} MB · PDF</p>
                        </div>
                        <button type="button" onClick={(e) => { e.stopPropagation(); setFile(null); }} className="ml-auto text-white/30 hover:text-white/60 text-lg transition-colors">✕</button>
                      </div>
                    ) : (
                      <>
                        <CloudArrowUpIcon className="w-9 h-9 text-white/30 mx-auto mb-3" />
                        <p className="text-white/60 font-medium mb-1">Drop PDF here or click to browse</p>
                        <p className="text-white/30 text-xs">PDF only · Max 30 MB</p>
                        {fileError && <p className="text-red-400 text-xs mt-2">{fileError}</p>}
                      </>
                    )}
                  </div>

                  {isAuthed && (
                    <div className="glass-card p-4 flex items-center justify-between">
                      <span className="text-white/50 text-sm">Uploading as</span>
                      <div className="text-right">
                        {username && <p className="text-brand-200 text-sm font-medium">{username}</p>}
                        {walletAddress && <p className="text-white/30 text-xs font-mono">{walletAddress.slice(0, 8)}…</p>}
                      </div>
                    </div>
                  )}

                  <button type="submit" className="btn-primary w-full py-4 text-base" disabled={!file}>
                    Add to Room — {room.code}
                  </button>
                </form>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
