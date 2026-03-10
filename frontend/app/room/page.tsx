"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { createRoom, joinRoom } from "@/lib/api";
import {
  LockClosedIcon,
  PlusCircleIcon,
  ArrowRightIcon,
  UserGroupIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";

type Panel = "choose" | "create" | "join";

export default function RoomPage() {
  const router = useRouter();
  const [panel, setPanel] = useState<Panel>("choose");
  const [roomName, setRoomName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomName.trim()) return;
    setCreating(true);
    setError(null);
    try {
      const room = createRoom(roomName.trim());
      router.push(`/room/${room.code}`);
    } catch {
      setError("Could not create room. Please try again.");
      setCreating(false);
    }
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const code = joinCode.trim().toUpperCase();
    if (code.length !== 6) {
      setError("Room code must be exactly 6 characters.");
      return;
    }
    const room = joinRoom(code);
    if (!room) {
      setError("No room found with that code. Double-check and try again.");
      return;
    }
    router.push(`/room/${room.code}`);
  };

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 sm:px-6">
      <div className="container mx-auto max-w-3xl">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 text-sm font-medium mb-5">
            <LockClosedIcon className="w-3.5 h-3.5" />
            Private Study Rooms
          </div>
          <h1 className="text-4xl font-bold text-white mb-3">
            Share Notes{" "}
            <span className="gradient-text">Privately</span>
          </h1>
          <p className="text-white/50 max-w-xl mx-auto">
            Create a private room and invite your study group with a unique 6-character code. Only members with the code can see the notes.
          </p>
        </motion.div>

        <AnimatePresence mode="wait">
          {/* ── Panel: Choose ── */}
          {panel === "choose" && (
            <motion.div key="choose" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="grid sm:grid-cols-2 gap-5">
              {/* Create */}
              <motion.button
                whileHover={{ y: -4, boxShadow: "0 0 30px rgba(99,102,241,0.25)" }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setPanel("create")}
                className="glass-card p-8 text-left group cursor-pointer w-full transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-2xl bg-brand-500/20 flex items-center justify-center mb-5 group-hover:bg-brand-500/30 transition-colors">
                  <PlusCircleIcon className="w-6 h-6 text-brand-400" />
                </div>
                <h2 className="text-lg font-semibold text-white mb-2">Create a Room</h2>
                <p className="text-sm text-white/40 leading-relaxed mb-4">Start a new private room and get a unique code to share with your group.</p>
                <span className="inline-flex items-center gap-1 text-brand-400 text-sm font-medium">
                  Get started <ArrowRightIcon className="w-3.5 h-3.5" />
                </span>
              </motion.button>

              {/* Join */}
              <motion.button
                whileHover={{ y: -4, boxShadow: "0 0 30px rgba(167,139,250,0.2)" }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setPanel("join")}
                className="glass-card p-8 text-left group cursor-pointer w-full transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-2xl bg-purple-500/20 flex items-center justify-center mb-5 group-hover:bg-purple-500/30 transition-colors">
                  <UserGroupIcon className="w-6 h-6 text-purple-400" />
                </div>
                <h2 className="text-lg font-semibold text-white mb-2">Join a Room</h2>
                <p className="text-sm text-white/40 leading-relaxed mb-4">Enter a 6-character code to access your group&apos;s private note collection.</p>
                <span className="inline-flex items-center gap-1 text-purple-400 text-sm font-medium">
                  Enter code <ArrowRightIcon className="w-3.5 h-3.5" />
                </span>
              </motion.button>
            </motion.div>
          )}

          {/* ── Panel: Create ── */}
          {panel === "create" && (
            <motion.div key="create" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="glass-card p-8">
                <div className="flex items-center gap-3 mb-7">
                  <div className="w-10 h-10 rounded-xl bg-brand-500/20 flex items-center justify-center">
                    <SparklesIcon className="w-5 h-5 text-brand-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-white">Create a Private Room</h2>
                    <p className="text-white/40 text-sm">A unique 6-character code will be generated for you</p>
                  </div>
                </div>

                <form onSubmit={handleCreate} className="space-y-4">
                  <div>
                    <label className="block text-sm text-white/70 mb-1.5 font-medium">Room Name *</label>
                    <input
                      className="input-field"
                      placeholder="e.g. Physics Study Group — Semester 4"
                      value={roomName}
                      onChange={(e) => setRoomName(e.target.value)}
                      required
                      maxLength={100}
                      autoFocus
                    />
                  </div>

                  {error && (
                    <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm">{error}</div>
                  )}

                  <div className="flex gap-3 pt-1">
                    <button type="button" onClick={() => { setPanel("choose"); setError(null); }} className="btn-ghost flex-1">← Back</button>
                    <button type="submit" className="btn-primary flex-1" disabled={creating || !roomName.trim()}>
                      {creating ? "Creating..." : "Create Room"}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}

          {/* ── Panel: Join ── */}
          {panel === "join" && (
            <motion.div key="join" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="glass-card p-8">
                <div className="flex items-center gap-3 mb-7">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                    <UserGroupIcon className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-white">Join a Private Room</h2>
                    <p className="text-white/40 text-sm">Enter the code shared by your group admin</p>
                  </div>
                </div>

                <form onSubmit={handleJoin} className="space-y-4">
                  <div>
                    <label className="block text-sm text-white/70 mb-1.5 font-medium">Room Code *</label>
                    <input
                      className="input-field uppercase tracking-[0.35em] text-center text-lg font-mono font-semibold"
                      placeholder="A B C 1 2 3"
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value.toUpperCase().slice(0, 6))}
                      required
                      maxLength={6}
                      autoFocus
                      spellCheck={false}
                    />
                    <p className="text-white/30 text-xs mt-1.5 text-center">6 characters, case-insensitive</p>
                  </div>

                  {error && (
                    <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm">{error}</div>
                  )}

                  <div className="flex gap-3 pt-1">
                    <button type="button" onClick={() => { setPanel("choose"); setError(null); }} className="btn-ghost flex-1">← Back</button>
                    <button type="submit" className="btn-primary flex-1" disabled={joinCode.length !== 6}>
                      Enter Room
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Info strip */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="mt-10 grid sm:grid-cols-3 gap-4">
          {[
            { label: "End-to-End Private", desc: "Notes never appear in the public explore feed" },
            { label: "Instant Access", desc: "Share the code and teammates join immediately" },
            { label: "Full Search", desc: "Search by title, topic, or uploader inside the room" },
          ].map((item) => (
            <div key={item.label} className="glass-card p-4 text-center">
              <p className="text-white/80 text-xs font-semibold mb-1">{item.label}</p>
              <p className="text-white/30 text-xs leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
