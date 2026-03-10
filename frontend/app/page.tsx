"use client";

import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useState, useEffect } from "react";
import { ArrowRightIcon, ShieldCheckIcon, CloudArrowUpIcon, MagnifyingGlassIcon, LockClosedIcon } from "@heroicons/react/24/outline";
import { ScrollReveal } from "@/components/ScrollReveal";
import { StarField, MeteorShower, FloatingOrbs, DotGrid, CountUp } from "@/components/Animations";

// ── Typewriter effect ─────────────────────────────────────────────────────────
const WORDS = ["Students.", "Scholars.", "Researchers.", "Learners."];
function TypeWriter() {
  const [idx, setIdx] = useState(0);
  const [shown, setShown] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const word = WORDS[idx];
    let timeout: ReturnType<typeof setTimeout>;
    if (!deleting && shown.length < word.length) {
      timeout = setTimeout(() => setShown(word.slice(0, shown.length + 1)), 80);
    } else if (!deleting && shown.length === word.length) {
      timeout = setTimeout(() => setDeleting(true), 1800);
    } else if (deleting && shown.length > 0) {
      timeout = setTimeout(() => setShown(shown.slice(0, -1)), 45);
    } else if (deleting && shown.length === 0) {
      setDeleting(false);
      setIdx((i) => (i + 1) % WORDS.length);
    }
    return () => clearTimeout(timeout);
  }, [shown, deleting, idx]);

  return (
    <span className="gradient-text neon-text">
      {shown}
      <span className="animate-pulse text-brand-400">|</span>
    </span>
  );
}

// ── Floating hero card ────────────────────────────────────────────────────────
function FloatingCard({ className, children, delay = 0 }: { className?: string; children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.6, ease: "easeOut" }}
      whileHover={{ scale: 1.06, boxShadow: "0 0 30px rgba(99,102,241,0.3)" }}
      className={`glass-card shimmer-card gradient-border p-4 absolute animate-float-y ${className}`}
      style={{ animationDelay: `${delay}s` }}
    >
      {children}
    </motion.div>
  );
}

const FEATURES = [
  { icon: ShieldCheckIcon, title: "Blockchain Verified", description: "Every note's SHA-256 hash is permanently stored on Polygon Amoy. Tamper-evident by design.", color: "text-brand-400", bg: "bg-brand-500/10", glow: "rgba(99,102,241,0.3)" },
  { icon: CloudArrowUpIcon, title: "IPFS Storage", description: "Files are stored on the InterPlanetary File System — decentralized, permanent, censorship-resistant.", color: "text-purple-400", bg: "bg-purple-500/10", glow: "rgba(167,139,250,0.3)" },
  { icon: MagnifyingGlassIcon, title: "Instant Discovery", description: "Search and filter thousands of notes by subject, keyword, or uploader wallet address.", color: "text-emerald-400", bg: "bg-emerald-500/10", glow: "rgba(52,211,153,0.3)" },
  { icon: LockClosedIcon, title: "Private Rooms", description: "Share notes privately with your study group using unique 6-character room codes.", color: "text-rose-400", bg: "bg-rose-500/10", glow: "rgba(251,113,133,0.3)" },
];

const HOW_IT_WORKS = [
  { step: "01", title: "Connect Wallet", desc: "Sign in using MetaMask or any WalletConnect compatible wallet." },
  { step: "02", title: "Upload Your Note", desc: "Drag & drop your PDF. We generate a SHA-256 hash automatically." },
  { step: "03", title: "On-Chain Registration", desc: "The hash is submitted to our Solidity smart contract on Polygon Amoy." },
  { step: "04", title: "Discover & Verify", desc: "Anyone can find your note and verify it hasn't been tampered with." },
];

const STATS = [
  { value: 2847, suffix: "+", label: "Notes Uploaded" },
  { value: 12, suffix: "", label: "Subjects Covered" },
  { value: 100,  suffix: "%", label: "Decentralized" },
  { value: 0, suffix: " fees", label: "Hidden Fees" },
];

export default function HomePage() {
  const { scrollY } = useScroll();
  const blob1Y = useTransform(scrollY, [0, 600], [0, -80]);
  const blob2Y = useTransform(scrollY, [0, 600], [0, -50]);
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0.3]);

  return (
    <div className="pt-16 relative">
      {/* Global bg animations */}
      <StarField count={80} />
      <MeteorShower count={6} />
      <FloatingOrbs />

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <section className="relative min-h-[92vh] flex items-center justify-center overflow-hidden px-6">
        <DotGrid className="opacity-40" />
        <div className="absolute inset-0 bg-hero-glow pointer-events-none" />

        {/* Parallax blobs */}
        <motion.div style={{ y: blob1Y }} className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-600/20 rounded-full blur-3xl pointer-events-none" />
        <motion.div style={{ y: blob2Y }} className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

        {/* Floating hero cards */}
        <FloatingCard className="hidden lg:block top-28 left-8 w-52" delay={0.6}>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded bg-green-500/20 flex items-center justify-center"><ShieldCheckIcon className="w-3.5 h-3.5 text-green-400" /></div>
            <span className="text-xs text-white/70 font-medium">Verified ✅</span>
          </div>
          <p className="text-[11px] text-white/40">Calculus III Notes</p>
          <p className="text-[10px] text-brand-400 font-mono mt-1">0xa3f2...8c1d</p>
        </FloatingCard>

        <FloatingCard className="hidden lg:block top-40 right-8 w-56" delay={0.9}>
          <p className="text-[11px] text-white/50 mb-1.5">SHA-256 Hash</p>
          <p className="text-[10px] font-mono text-brand-300 break-all">e3b0c44298fc1c149afb...</p>
          <div className="mt-2 h-1.5 rounded-full bg-gradient-to-r from-brand-500 to-purple-500 opacity-60" />
        </FloatingCard>

        <FloatingCard className="hidden lg:block bottom-32 left-16 w-48" delay={1.2}>
          <p className="text-[11px] text-white/50 mb-1">Notes Uploaded</p>
          <p className="text-2xl font-bold gradient-text">2,847</p>
          <p className="text-[10px] text-white/30 mt-0.5">across 12 subjects</p>
        </FloatingCard>

        <FloatingCard className="hidden lg:block bottom-20 right-12 w-44" delay={1.5}>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-[10px] text-white/50">Live on Polygon</span>
          </div>
          <p className="text-[11px] text-white/70 font-mono">Block #<span className="text-brand-300">41,829,441</span></p>
        </FloatingCard>

        {/* Hero content */}
        <motion.div style={{ opacity: heroOpacity }} className="relative z-10 text-center max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-500/15 border border-brand-500/30 text-brand-300 text-sm font-medium mb-6 glow-ring">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />
              Built on Polygon Amoy Testnet
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.7 }}
            className="text-5xl md:text-7xl font-extrabold text-white leading-tight mb-4"
          >
            Academic Notes,{" "}
            <br className="hidden sm:block" />
            <span className="gradient-text">Verified Forever</span>
          </motion.h1>

          {/* Typewriter */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="text-2xl md:text-3xl font-semibold text-white/60 mb-4 h-10">
            Built for <TypeWriter />
          </motion.div>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55, duration: 0.6 }} className="text-lg md:text-xl text-white/40 max-w-2xl mx-auto mb-10">
            Upload study notes to IPFS, register their cryptographic hash on-chain, and share tamper-proof knowledge with students worldwide.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7, duration: 0.5 }} className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/explore" className="btn-primary flex items-center gap-2 text-base px-8 py-4 glow-ring">
              Explore Notes <ArrowRightIcon className="w-4 h-4" />
            </Link>
            <Link href="/upload" className="btn-ghost flex items-center gap-2 text-base px-8 py-4">
              Upload a Note
            </Link>
          </motion.div>
        </motion.div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-surface-DEFAULT to-transparent pointer-events-none" />
      </section>

      {/* ── Stats strip ─────────────────────────────────────────────────────── */}
      <section className="py-12 px-6 relative aurora-bg">
        <div className="container mx-auto max-w-4xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {STATS.map((s, i) => (
              <ScrollReveal key={s.label} direction="up" delay={i * 0.08}>
                <div className="text-center">
                  <p className="text-3xl font-extrabold gradient-text neon-text mb-1">
                    <CountUp target={s.value} suffix={s.suffix} />
                  </p>
                  <p className="text-white/40 text-xs font-medium">{s.label}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────────────────────── */}
      <section className="py-24 px-6 relative">
        <DotGrid className="opacity-20" />
        <div className="container mx-auto max-w-6xl relative z-10">
          <ScrollReveal direction="up" duration={0.7}>
            <div className="text-center mb-16">
              <h2 className="section-heading mb-4">Why <span className="gradient-text">NOTES</span>?</h2>
              <p className="text-white/50 max-w-xl mx-auto">Built for the next generation of students — decentralized, transparent, and incorruptible.</p>
            </div>
          </ScrollReveal>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {FEATURES.map((f, i) => (
              <ScrollReveal key={f.title} direction="up" delay={i * 0.1} duration={0.6}>
                <motion.div
                  whileHover={{ y: -8, boxShadow: `0 0 40px ${f.glow}` }}
                  transition={{ type: "spring", stiffness: 300, damping: 18 }}
                  className="glass-card shimmer-card gradient-border p-6 flex flex-col gap-4 h-full cursor-default"
                >
                  <motion.div
                    whileHover={{ rotate: 12, scale: 1.15 }}
                    className={`w-11 h-11 rounded-xl ${f.bg} flex items-center justify-center`}
                  >
                    <f.icon className={`w-5 h-5 ${f.color}`} />
                  </motion.div>
                  <h3 className="font-semibold text-white">{f.title}</h3>
                  <p className="text-sm text-white/50 leading-relaxed">{f.description}</p>
                </motion.div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ────────────────────────────────────────────────────── */}
      <section className="py-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-brand-950/20 to-transparent pointer-events-none" />
        <div className="container mx-auto max-w-5xl relative z-10">
          <ScrollReveal direction="fade" duration={0.7}>
            <div className="text-center mb-16">
              <h2 className="section-heading mb-4">How It <span className="gradient-text">Works</span></h2>
              <p className="text-white/50">Four simple steps to immortalize your knowledge on the blockchain.</p>
            </div>
          </ScrollReveal>

          <div className="grid md:grid-cols-4 gap-6 relative">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-6 left-[12%] right-[12%] h-px bg-gradient-to-r from-brand-500/20 via-purple-500/40 to-brand-500/20" />
            {HOW_IT_WORKS.map((item, i) => (
              <ScrollReveal key={item.step} direction="up" delay={i * 0.15} duration={0.6}>
                <div className="text-center relative group">
                  <motion.div
                    whileHover={{ scale: 1.15, rotate: [0, -5, 5, 0], boxShadow: "0 0 30px rgba(99,102,241,0.5)" }}
                    transition={{ type: "spring", stiffness: 400, damping: 12 }}
                    className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-500/30 to-purple-500/20 border border-brand-500/30 flex items-center justify-center text-brand-300 font-mono font-bold text-sm mx-auto mb-4 cursor-default glow-ring"
                  >
                    {item.step}
                  </motion.div>
                  <h3 className="font-semibold text-white mb-2 text-sm group-hover:text-brand-300 transition-colors">{item.title}</h3>
                  <p className="text-xs text-white/40 leading-relaxed">{item.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────────────── */}
      <section className="py-24 px-6 relative">
        <div className="container mx-auto max-w-3xl">
          <ScrollReveal direction="scale" duration={0.7}>
            <motion.div
              whileHover={{ boxShadow: "0 0 80px rgba(99,102,241,0.25)" }}
              transition={{ duration: 0.4 }}
              className="glass-card shimmer-card gradient-border p-12 text-center relative overflow-hidden"
            >
              <div className="absolute inset-0 aurora-bg opacity-30 pointer-events-none rounded-2xl" />
              <div className="scan-line" />
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 relative z-10">
                Ready to share your <span className="gradient-text neon-text">knowledge</span>?
              </h2>
              <p className="text-white/50 mb-8 relative z-10">Join students who are making education open, verifiable, and borderless.</p>
              <Link href="/upload" className="btn-primary inline-flex items-center gap-2 text-base px-10 py-4 relative z-10 glow-ring">
                Upload Your First Note <ArrowRightIcon className="w-4 h-4" />
              </Link>
            </motion.div>
          </ScrollReveal>
        </div>
      </section>
    </div>
  );
}
