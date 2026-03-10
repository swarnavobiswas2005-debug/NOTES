"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { NoteCard } from "@/components/NoteCard";
import { fetchNotes, Note, SUBJECTS } from "@/lib/api";
import { MagnifyingGlassIcon, AdjustmentsHorizontalIcon } from "@heroicons/react/24/outline";
import { useInView } from "react-intersection-observer";
import { DotGrid } from "@/components/Animations";

type SearchType = "title" | "topic" | "uploader";

const SEARCH_TYPE_LABELS: Record<SearchType, string> = {
  title: "Title",
  topic: "Topic",
  uploader: "Uploader",
};

export default function ExplorePage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [subject, setSubject] = useState("");
  const [searchType, setSearchType] = useState<SearchType>("title");
  const LIMIT = 12;
  const { ref: sentinelRef, inView } = useInView({ threshold: 0.1 });

  const pendingSearch = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = async (p: number, reset = false) => {
    if (loading) return;
    setLoading(true);
    try {
      const data = await fetchNotes({ page: p, limit: LIMIT, search, subject, search_type: searchType });
      setNotes((prev) => reset ? data.notes : [...prev, ...data.notes]);
      setTotalPages(data.pages);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  // Reset + reload on filter changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    setPage(1);
    load(1, true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, subject, searchType]);

  // Infinite scroll
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (inView && page < totalPages && !loading) {
      const next = page + 1;
      setPage(next);
      load(next);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView]);

  const handleSearch = (val: string) => {
    setSearch(val);
    if (pendingSearch.current) clearTimeout(pendingSearch.current);
  };

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 sm:px-6 relative">
      <DotGrid className="opacity-15 fixed" />
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <h1 className="text-4xl font-bold text-white mb-3">Explore Notes</h1>
          <p className="text-white/50">Discover and download verified academic notes from students worldwide.</p>
        </motion.div>

        {/* Filters */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="glass-card p-4 mb-8">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search input */}
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                className="input-field pl-11"
                placeholder={`Search by ${SEARCH_TYPE_LABELS[searchType].toLowerCase()}...`}
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>

            {/* Subject filter */}
            <div className="relative sm:w-48">
              <AdjustmentsHorizontalIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <select
                className="input-field pl-11 appearance-none"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              >
                <option value="" className="bg-surface-DEFAULT">All Subjects</option>
                {SUBJECTS.map((s) => <option key={s} value={s} className="bg-surface-DEFAULT">{s}</option>)}
              </select>
            </div>
          </div>

          {/* Search type pills */}
          <div className="flex items-center gap-2 mt-3">
            <span className="text-white/30 text-xs font-medium mr-1">Search by:</span>
            {(["title", "topic", "uploader"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setSearchType(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  searchType === t
                    ? "bg-brand-500/30 text-brand-200 border border-brand-500/50"
                    : "bg-white/5 text-white/40 hover:text-white/70 border border-white/10"
                }`}
              >
                {SEARCH_TYPE_LABELS[t]}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Notes grid */}
        {notes.length === 0 && !loading ? (
          <div className="text-center py-24 text-white/30">
            <MagnifyingGlassIcon className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium">No notes found</p>
            <p className="text-sm mt-1">Try a different search or subject filter</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            <AnimatePresence>
              {notes.map((note, i) => (
                <NoteCard key={note.id} note={note} index={i} />
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Loading skeletons */}
        {loading && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 mt-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="glass-card p-5 h-52 animate-pulse">
                <div className="h-4 bg-white/10 rounded-full w-1/2 mb-3" />
                <div className="h-5 bg-white/10 rounded-full w-3/4 mb-2" />
                <div className="h-3 bg-white/5 rounded-full w-full mb-1" />
                <div className="h-3 bg-white/5 rounded-full w-2/3" />
              </div>
            ))}
          </div>
        )}

        {/* Sentinel for infinite scroll */}
        {page < totalPages && <div ref={sentinelRef} className="h-10" />}
      </div>
    </div>
  );
}
