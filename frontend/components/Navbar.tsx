"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { AuthModal } from "@/components/AuthModal";
import {
  ArrowRightEndOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

const NAV_LINKS = [
  { href: "/explore", label: "Explore" },
  { href: "/upload", label: "Upload" },
  { href: "/room", label: "Rooms 🔒" },
  { href: "/verify", label: "Verify" },
];

// ── Auth button ───────────────────────────────────────────────────────────────
function AuthButton({ onClose }: { onClose?: () => void }) {
  const { walletAddress, username, isWalletConnected, isPasswordSession, isGhostSession, needsProfile, logout, initials } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (needsProfile) setShowModal(true);
  }, [needsProfile]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const isLoggedIn = isWalletConnected || isPasswordSession || isGhostSession;

  if (isGhostSession) {
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setShowDropdown(v => !v)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all animate-pulse-slow"
          title="Ghost Mode active — double Ctrl to exit"
        >
          <span className="text-xl leading-none">👻</span>
          <span className="text-white/40 text-xs font-medium">Ghost</span>
        </button>
        <AnimatePresence>
          {showDropdown && (
            <motion.div initial={{ opacity: 0, y: 6, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 6, scale: 0.96 }} transition={{ duration: 0.15 }} className="absolute right-0 top-full mt-2 w-52 glass-card p-2 z-50">
              <div className="px-3 py-2.5 border-b border-white/10 mb-1">
                <p className="text-white text-sm font-semibold">👻 Ghost Mode</p>
                <p className="text-white/30 text-xs mt-0.5">Auth bypassed • double Ctrl to exit</p>
              </div>
              <button onClick={() => { logout(); setShowDropdown(false); onClose?.(); }} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/5 transition-all">
                <ArrowRightEndOnRectangleIcon className="w-4 h-4" />
                Exit Ghost Mode
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  if (isWalletConnected && username) {
    return (
      <div className="flex items-center gap-2">
        <ConnectButton accountStatus="avatar" chainStatus="none" showBalance={false} />
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowDropdown(v => !v)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-brand-500/15 border border-brand-500/30 hover:bg-brand-500/25 transition-all"
          >
            <span className="w-6 h-6 rounded-md bg-gradient-to-br from-brand-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {initials}
            </span>
            <span className="text-brand-200 text-sm font-medium max-w-[90px] truncate">{username}</span>
          </button>
          <AnimatePresence>
            {showDropdown && (
              <motion.div initial={{ opacity: 0, y: 6, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 6, scale: 0.96 }} transition={{ duration: 0.15 }} className="absolute right-0 top-full mt-2 w-56 glass-card p-2 z-50">
                <div className="px-3 py-2.5 border-b border-white/10 mb-1">
                  <p className="text-white text-sm font-semibold">{username}</p>
                  <p className="text-white/30 text-xs font-mono truncate">{walletAddress?.slice(0, 10)}…</p>
                  <p className="text-white/25 text-[11px] mt-0.5">Wallet credentials active</p>
                </div>
                <button onClick={() => { setShowDropdown(false); setShowModal(true); }} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/5 transition-all text-left">
                  🔑 Manage Credentials
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        {showModal && <AuthModal onClose={() => setShowModal(false)} />}
      </div>
    );
  }

  if (isWalletConnected && needsProfile) {
    return (
      <div className="flex items-center gap-2">
        <ConnectButton accountStatus="avatar" chainStatus="none" showBalance={false} />
        <button
          onClick={() => setShowModal(true)}
          className="px-3 py-1.5 rounded-xl bg-yellow-500/15 border border-yellow-500/30 text-yellow-300 text-xs font-medium hover:bg-yellow-500/25 transition-all animate-pulse"
        >
          Set up password →
        </button>
        {showModal && <AuthModal onClose={() => setShowModal(false)} />}
      </div>
    );
  }

  if (isPasswordSession && walletAddress) {
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setShowDropdown(v => !v)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-brand-500/15 border border-brand-500/30 hover:bg-brand-500/25 transition-all"
        >
          <span className="w-6 h-6 rounded-md bg-gradient-to-br from-brand-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
            {initials}
          </span>
          <span className="text-brand-200 text-sm font-medium max-w-[90px] truncate">{username}</span>
        </button>
        <AnimatePresence>
          {showDropdown && (
            <motion.div initial={{ opacity: 0, y: 6, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 6, scale: 0.96 }} transition={{ duration: 0.15 }} className="absolute right-0 top-full mt-2 w-56 glass-card p-2 z-50">
              <div className="px-3 py-2.5 border-b border-white/10 mb-1">
                <p className="text-white text-sm font-semibold">{username}</p>
                <p className="text-white/30 text-xs font-mono truncate">{walletAddress?.slice(0, 10)}…</p>
                <p className="text-white/25 text-[11px] mt-0.5">Signed in via wallet credentials</p>
              </div>
              <button onClick={() => { logout(); setShowDropdown(false); onClose?.(); }} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/5 transition-all">
                <ArrowRightEndOnRectangleIcon className="w-4 h-4" />
                Sign Out
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <>
      <button onClick={() => { setShowModal(true); onClose?.(); }} className="btn-primary flex items-center gap-2 text-sm px-4 py-2">
        <span>Connect / Sign In</span>
      </button>
      {showModal && <AuthModal onClose={() => setShowModal(false)} />}
    </>
  );
}

// ── Navbar ────────────────────────────────────────────────────────────────────
export function Navbar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const { toggleGhost, isGhostSession } = useAuth();

  // ── Secret logo tap counter (5 taps within 2 s) ──────────────────────────
  const tapCount = useRef(0);
  const tapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [ghostToast, setGhostToast] = useState<string | null>(null);

  const handleLogoTap = () => {
    tapCount.current += 1;
    if (tapTimer.current) clearTimeout(tapTimer.current);
    if (tapCount.current >= 5) {
      tapCount.current = 0;
      toggleGhost();
      setGhostToast(isGhostSession ? "🚫 Ghost Mode OFF" : "👻 Ghost Mode ON");
      setTimeout(() => setGhostToast(null), 2000);
    } else {
      tapTimer.current = setTimeout(() => { tapCount.current = 0; }, 2000);
    }
  };

  // Close menu on route change
  useEffect(() => { setMenuOpen(false); }, [pathname]);

  // Lock body scroll when menu is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  return (
    <>
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 backdrop-blur-xl bg-surface-DEFAULT/80"
    >
      <div className="container mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        {/* Logo — tap 5× to toggle ghost mode on mobile */}
        <Link
          href="/"
          className="flex items-center gap-2.5 group flex-shrink-0"
          onClick={(e) => {
            // On touch devices, intercept the tap for the counter
            // The link still navigates unless we call preventDefault after 5 taps
            handleLogoTap();
            setMenuOpen(false);
          }}
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-400 to-purple-500 flex items-center justify-center font-extrabold text-white text-sm shadow-glow-sm group-hover:shadow-glow transition-all duration-300">
            N
          </div>
          <span className="font-bold text-white text-lg tracking-tight">NOTES</span>
        </Link>

        {/* Desktop nav links */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                pathname?.startsWith(link.href)
                  ? "bg-brand-500/20 text-brand-300"
                  : "text-white/60 hover:text-white hover:bg-white/5"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right side: auth + hamburger */}
        <div className="flex items-center gap-2">
          <AuthButton onClose={() => setMenuOpen(false)} />

          {/* Hamburger — mobile only */}
          <button
            className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-all"
            onClick={() => setMenuOpen(v => !v)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
          >
            {menuOpen ? <XMarkIcon className="w-5 h-5" /> : <Bars3Icon className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile slide-down menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
            className="md:hidden overflow-hidden border-t border-white/10 bg-surface-DEFAULT/95 backdrop-blur-xl"
          >
            <nav className="px-4 py-3 flex flex-col gap-1">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className={`px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    pathname?.startsWith(link.href)
                      ? "bg-brand-500/20 text-brand-300"
                      : "text-white/60 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>

    {/* Ghost mode toast — mobile feedback for the 5-tap trigger */}
    <AnimatePresence>
      {ghostToast && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className="fixed top-[4.5rem] left-1/2 -translate-x-1/2 z-[99980] px-5 py-2.5 rounded-full glass-card text-white text-sm font-semibold shadow-glow pointer-events-none"
        >
          {ghostToast}
        </motion.div>
      )}
    </AnimatePresence>
    </>
  );
}
