"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { fetchNote, Note, formatBytes, truncateAddress, formatDate } from "@/lib/api";
import {
  ArrowDownTrayIcon,
  ArrowTopRightOnSquareIcon,
  ShieldCheckIcon,
  UserIcon,
  CalendarIcon,
  DocumentIcon,
  ClipboardDocumentIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  return (
    <button onClick={copy} className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors">
      {copied ? <CheckIcon className="w-3.5 h-3.5 text-green-400" /> : <ClipboardDocumentIcon className="w-3.5 h-3.5" />}
    </button>
  );
}

export default function NoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resolvedId, setResolvedId] = useState<string>("");

  useEffect(() => {
    params.then(({ id }) => setResolvedId(id));
  }, [params]);

  useEffect(() => {
    if (!resolvedId) return;
    fetchNote(resolvedId)
      .then(setNote)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [resolvedId]);

  if (loading) {
    return (
      <div className="min-h-screen pt-28 px-6 flex items-center justify-center">
        <div className="glass-card p-12 text-center">
          <div className="w-8 h-8 border-2 border-brand-500/40 border-t-brand-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/50">Loading note...</p>
        </div>
      </div>
    );
  }

  if (error || !note) {
    return (
      <div className="min-h-screen pt-28 px-6 flex items-center justify-center">
        <div className="glass-card p-12 text-center">
          <p className="text-red-400 mb-4">{error || "Note not found"}</p>
          <Link href="/explore" className="btn-ghost">Back to Explore</Link>
        </div>
      </div>
    );
  }

  const POLY_SCAN = "https://amoy.polygonscan.com/tx/";
  const isPDF = note.file_name?.endsWith(".pdf");
  const isImage = /\.(png|jpe?g)$/i.test(note.file_name || "");

  return (
    <div className="min-h-screen pt-28 pb-20 px-6">
      <div className="container mx-auto max-w-5xl">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="grid lg:grid-cols-3 gap-8">
          {/* ── Main column ─────────────────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title & badges */}
            <div>
              <div className="flex flex-wrap gap-2 mb-3">
                <span className="badge bg-brand-500/20 text-brand-300">{note.subject}</span>
                {note.tags?.map((t) => (
                  <span key={t} className="badge bg-white/5 text-white/40">#{t}</span>
                ))}
              </div>
              <h1 className="text-3xl font-bold text-white leading-snug">{note.title}</h1>
              <div className="flex flex-wrap gap-4 mt-4 text-sm text-white/50">
                <span className="flex items-center gap-1.5"><UserIcon className="w-4 h-4" />{truncateAddress(note.uploader_wallet)}</span>
                <span className="flex items-center gap-1.5"><CalendarIcon className="w-4 h-4" />{formatDate(note.created_at)}</span>
                <span className="flex items-center gap-1.5"><DocumentIcon className="w-4 h-4" />{formatBytes(note.file_size)}</span>
              </div>
            </div>

            {/* Description */}
            {note.description && (
              <div className="glass-card p-6">
                <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wide mb-3">About</h2>
                <p className="text-white/70 leading-relaxed">{note.description}</p>
              </div>
            )}

            {/* File preview */}
            <div className="glass-card p-6">
              <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wide mb-4">Preview</h2>
              {isPDF ? (
                <iframe src={`${note.ipfs_url}#toolbar=0`} className="w-full h-96 rounded-xl border border-white/10" title="PDF Preview" />
              ) : isImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={note.ipfs_url} alt={note.title} className="w-full max-h-96 object-contain rounded-xl" />
              ) : (
                <div className="h-40 flex items-center justify-center text-white/30 border border-white/5 rounded-xl">
                  <div className="text-center">
                    <DocumentIcon className="w-10 h-10 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">No preview available for this file type</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Side column ─────────────────────────────────────────────────── */}
          <div className="space-y-4">
            {/* Download */}
            <a
              href={note.ipfs_url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary w-full flex items-center justify-center gap-2 py-4"
            >
              <ArrowDownTrayIcon className="w-4 h-4" />
              Download File
            </a>

            {/* Verify button */}
            <Link href="/verify" className="btn-ghost w-full flex items-center justify-center gap-2 py-3">
              <ShieldCheckIcon className="w-4 h-4" />
              Verify Authenticity
            </Link>

            {/* Blockchain info */}
            <div className="glass-card p-5 space-y-4">
              <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wide">Blockchain Record</h2>

              <div>
                <p className="text-xs text-white/40 mb-1">SHA-256 Hash</p>
                <div className="flex items-start gap-1">
                  <p className="text-xs font-mono text-brand-300 break-all flex-1">{note.file_hash}</p>
                  <CopyButton text={note.file_hash} />
                </div>
              </div>

              {note.tx_hash && (
                <div>
                  <p className="text-xs text-white/40 mb-1">Transaction Hash</p>
                  <div className="flex items-start gap-1">
                    <p className="text-xs font-mono text-purple-300 break-all flex-1">
                      {note.tx_hash.startsWith("0xmock") ? "Pending blockchain sync..." : note.tx_hash}
                    </p>
                    {!note.tx_hash.startsWith("0xmock") && <CopyButton text={note.tx_hash} />}
                  </div>
                  {!note.tx_hash.startsWith("0xmock") && (
                    <a
                      href={`${POLY_SCAN}${note.tx_hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-white/30 hover:text-white/60 mt-2 transition-colors"
                    >
                      View on PolygonScan <ArrowTopRightOnSquareIcon className="w-3 h-3" />
                    </a>
                  )}
                </div>
              )}

              {note.onChain ? (
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-green-500/10 border border-green-500/20">
                  <ShieldCheckIcon className="w-4 h-4 text-green-400 flex-shrink-0" />
                  <p className="text-xs text-green-300 font-medium">Verified on Blockchain ✅</p>
                </div>
              ) : (
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                  <ShieldCheckIcon className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                  <p className="text-xs text-yellow-300 font-medium">Stored in Database</p>
                </div>
              )}
            </div>

            {/* IPFS link */}
            <div className="glass-card p-4">
              <p className="text-xs text-white/40 mb-2">IPFS URL</p>
              <a href={note.ipfs_url} target="_blank" rel="noopener noreferrer" className="text-xs text-brand-300 break-all hover:text-brand-200 transition-colors inline-flex items-center gap-1">
                {note.ipfs_url.slice(0, 50)}...
                <ArrowTopRightOnSquareIcon className="w-3 h-3 flex-shrink-0" />
              </a>
            </div>

            <Link href="/explore" className="block text-center text-sm text-white/30 hover:text-white/50 transition-colors pt-2">
              ← Back to Explore
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
