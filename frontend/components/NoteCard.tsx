"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Note, formatBytes, truncateAddress, formatDate } from "@/lib/api";
import { BookOpenIcon, CalendarIcon, UserIcon, ArrowDownTrayIcon, ShieldCheckIcon } from "@heroicons/react/24/outline";

const SUBJECT_COLORS: Record<string, string> = {
  Mathematics: "bg-blue-500/20 text-blue-300",
  Physics: "bg-purple-500/20 text-purple-300",
  Chemistry: "bg-green-500/20 text-green-300",
  Biology: "bg-emerald-500/20 text-emerald-300",
  "Computer Science": "bg-brand-500/20 text-brand-300",
  Engineering: "bg-orange-500/20 text-orange-300",
  Economics: "bg-yellow-500/20 text-yellow-300",
  History: "bg-rose-500/20 text-rose-300",
  Literature: "bg-pink-500/20 text-pink-300",
  Philosophy: "bg-violet-500/20 text-violet-300",
};

function subjectColor(subject: string) {
  return SUBJECT_COLORS[subject] || "bg-white/10 text-white/60";
}

export function NoteCard({ note, index = 0 }: { note: Note; index?: number }) {
  const chapterLabel = note.chapter_number
    ? `Ch.${note.chapter_number}${note.chapter_name ? ` · ${note.chapter_name}` : ""}`
    : note.chapter_name || null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.04, ease: "easeOut" }}
      whileHover={{ y: -6 }}
      className="group glass-card shimmer-card gradient-border overflow-hidden flex flex-col cursor-pointer hover:border-brand-500/40 transition-all duration-300 hover:shadow-glow"
    >
      <Link href={`/notes/${note.id}`} className="flex-1 p-5">
        {/* Subject badge + file size */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <span className={`badge ${subjectColor(note.subject)} group-hover:shadow-sm transition-all`}>
            <motion.span whileHover={{ rotate: 15 }} style={{ display: 'inline-block' }}>
              <BookOpenIcon className="w-3 h-3" />
            </motion.span>
            {note.subject}
          </span>
          <span className="text-white/30 text-xs flex-shrink-0">{formatBytes(note.file_size)}</span>
        </div>

        {/* Title */}
        <h3 className="font-semibold text-white text-base mb-2 line-clamp-2 group-hover:text-brand-300 transition-colors duration-200">
          {note.title}
        </h3>

        {/* Chapter + Topic badges */}
        {(chapterLabel || note.topic_name) && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {chapterLabel && (
              <span className="badge bg-brand-500/10 text-brand-300 border border-brand-500/20">
                {chapterLabel}
              </span>
            )}
            {note.topic_name && (
              <span className="badge bg-purple-500/10 text-purple-300 border border-purple-500/20">
                {note.topic_name}
              </span>
            )}
          </div>
        )}

        {/* Description (fallback) */}
        {!note.topic_name && note.description && (
          <p className="text-white/50 text-sm line-clamp-2 mb-3">{note.description}</p>
        )}

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-3 text-white/40 text-xs mt-auto pt-1">
          <span className="flex items-center gap-1">
            <UserIcon className="w-3 h-3" />
            {note.uploader_name || truncateAddress(note.uploader_wallet)}
          </span>
          <span className="flex items-center gap-1">
            <CalendarIcon className="w-3 h-3" />
            {formatDate(note.created_at)}
          </span>
        </div>
      </Link>

      {/* Actions */}
      <div className="border-t border-white/5 px-5 py-3 flex gap-2">
        <a
          href={note.ipfs_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium text-white/60 hover:text-brand-300 transition-colors py-1.5 rounded-lg hover:bg-brand-500/10"
          onClick={(e) => e.stopPropagation()}
        >
          <ArrowDownTrayIcon className="w-3.5 h-3.5" />
          Download
        </a>
        <Link
          href="/verify"
          className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium text-white/60 hover:text-green-400 transition-colors py-1.5 rounded-lg hover:bg-green-500/10"
          onClick={(e) => e.stopPropagation()}
        >
          <ShieldCheckIcon className="w-3.5 h-3.5" />
          Verify
        </Link>
      </div>
    </motion.div>
  );
}
