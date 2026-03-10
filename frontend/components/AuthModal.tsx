"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import { useAuth } from "@/context/AuthContext";
import { registerWalletProfile, loginWithWalletPassword, walletHasProfile } from "@/lib/auth";
import {
  XMarkIcon,
  EyeIcon,
  EyeSlashIcon,
  UserCircleIcon,
  WalletIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
  KeyIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/outline";

type Screen = "connect" | "setup" | "credentials" | "done";

interface AuthModalProps {
  onClose: () => void;
}

export function AuthModal({ onClose }: AuthModalProps) {
  const { address } = useAccount();
  const { setProfile, walletAddress: sessionWallet } = useAuth();

  // Determine initial screen
  const getInitialScreen = (): Screen => {
    if (address && walletHasProfile(address)) return "done"; // already set up, shouldn't reach here
    if (address && !walletHasProfile(address)) return "setup"; // wallet connected, no profile yet
    return "connect"; // nothing connected
  };

  const [screen, setScreen] = useState<Screen>(getInitialScreen);

  // Auto-advance ONLY when wallet JUST connected (address went from undefined → value)
  // Don't auto-advance on modal open if wallet was already connected before
  const prevAddress = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (address && !prevAddress.current && screen === "connect") {
      // Wallet just connected during this modal session
      setScreen(walletHasProfile(address) ? "done" : "setup");
    }
    prevAddress.current = address;
  }, [address, screen]);

  // Setup form state
  const [setupUsername, setSetupUsername] = useState("");
  const [setupPassword, setSetupPassword] = useState("");
  const [showSetupPw, setShowSetupPw] = useState(false);
  const [setupLoading, setSetupLoading] = useState(false);
  const [setupError, setSetupError] = useState<string | null>(null);

  // Credentials form state
  const [credUser, setCredUser] = useState("");
  const [credPass, setCredPass] = useState("");
  const [showCredPw, setShowCredPw] = useState(false);
  const [credLoading, setCredLoading] = useState(false);
  const [credError, setCredError] = useState<string | null>(null);
  const [credDone, setCredDone] = useState(false);

  const backdropRef = useRef<HTMLDivElement>(null);

  // Lock scroll + Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", handler); document.body.style.overflow = ""; };
  }, [onClose]);

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address) return;
    setSetupError(null); setSetupLoading(true);
    try {
      const profile = await registerWalletProfile(address, setupUsername, setupPassword);
      setProfile(profile);
      setScreen("done");
    } catch (err: unknown) {
      setSetupError(err instanceof Error ? err.message : "Setup failed.");
    } finally { setSetupLoading(false); }
  };

  const handleCredSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setCredError(null); setCredLoading(true);
    try {
      const profile = await loginWithWalletPassword(credUser, credPass);
      setProfile(profile);
      setCredDone(true);
      setTimeout(onClose, 900);
    } catch (err: unknown) {
      setCredError(err instanceof Error ? err.message : "Sign-in failed.");
    } finally { setCredLoading(false); }
  };

  const STEP_LABELS = {
    connect: "Step 1 of 2 — Connect Wallet",
    setup:   "Step 2 of 2 — Create Credentials",
    credentials: "Sign In with Wallet Credentials",
    done: "All set!",
  };

  const modal = (
    <AnimatePresence>
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        ref={backdropRef}
        onClick={(e) => { if (e.target === backdropRef.current) onClose(); }}
        className="fixed inset-0 z-[99990] flex items-center justify-center p-4"
        style={{ background: "rgba(0,0,0,0.78)", backdropFilter: "blur(8px)" }}
      >
        <motion.div
          key="panel"
          initial={{ opacity: 0, scale: 0.93, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.93, y: 16 }}
          transition={{ type: "spring", stiffness: 300, damping: 27 }}
          className="relative w-full max-w-[440px] glass-card overflow-hidden"
          style={{ border: "1px solid rgba(255,255,255,0.12)" }}
        >
          {/* Header */}
          <div className="px-6 pt-6 pb-4 border-b border-white/10 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-white">
                {screen === "credentials" ? "Wallet Credentials" : "Connect & Sign In"}
              </h2>
              <p className="text-white/35 text-xs mt-0.5">{STEP_LABELS[screen]}</p>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all flex-shrink-0 mt-0.5">
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>

          {/* Progress bar (connect → setup only) */}
          {(screen === "connect" || screen === "setup") && (
            <div className="h-0.5 bg-white/5">
              <motion.div
                className="h-full bg-gradient-to-r from-brand-400 to-purple-500"
                initial={{ width: "0%" }}
                animate={{ width: screen === "connect" ? "50%" : "100%" }}
                transition={{ duration: 0.4 }}
              />
            </div>
          )}

          <div className="p-6">
            <AnimatePresence mode="wait">

              {/* ── SCREEN: connect wallet ── */}
              {screen === "connect" && (
                <motion.div key="connect" initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }} transition={{ duration: 0.22 }}>
                  <div className="flex flex-col items-center text-center pt-2 pb-4">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500/30 to-purple-500/20 border border-brand-500/30 flex items-center justify-center mb-4">
                      <WalletIcon className="w-8 h-8 text-brand-300" />
                    </div>
                    <p className="text-white font-semibold mb-1">Connect your wallet</p>
                    <p className="text-white/40 text-sm mb-6 max-w-[280px]">
                      Connect with MetaMask or WalletConnect. After connecting you&apos;ll set a username and password for quick sign-in.
                    </p>
                    <ConnectButton label="Connect Wallet" />
                  </div>

                  {/* Divider */}
                  <div className="flex items-center gap-3 my-4">
                    <div className="flex-1 h-px bg-white/10" />
                    <span className="text-white/25 text-xs">or</span>
                    <div className="flex-1 h-px bg-white/10" />
                  </div>

                  <button
                    onClick={() => setScreen("credentials")}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-white/10 text-white/50 hover:text-white hover:border-brand-500/40 hover:bg-brand-500/5 transition-all text-sm"
                  >
                    <KeyIcon className="w-4 h-4" />
                    Sign in with wallet credentials
                  </button>
                </motion.div>
              )}

              {/* ── SCREEN: setup credentials (wallet connected, no profile) ── */}
              {screen === "setup" && address && (
                <motion.div key="setup" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.22 }}>
                  {/* Connected wallet indicator */}
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-green-500/10 border border-green-500/25 mb-5">
                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-green-300 text-xs font-semibold">Wallet connected ✓</p>
                      <p className="text-white/35 text-xs font-mono truncate">{address}</p>
                    </div>
                  </div>

                  <p className="text-white/55 text-sm mb-4 leading-relaxed">
                    Create a <strong className="text-white">username</strong> and <strong className="text-white">password</strong> for this wallet. Use these to sign in anytime — even without MetaMask.
                  </p>

                  <form onSubmit={handleSetup} className="space-y-4">
                    <div>
                      <label className="block text-sm text-white/70 mb-1.5 font-medium">Username *</label>
                      <div className="relative">
                        <UserCircleIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
                        <input
                          className="input-field pl-10"
                          placeholder="e.g. rahul_physics"
                          value={setupUsername}
                          onChange={(e) => setSetupUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                          required minLength={3} maxLength={30} autoFocus spellCheck={false}
                        />
                      </div>
                      <p className="text-white/25 text-xs mt-1">Letters, numbers, underscores · min 3 chars</p>
                    </div>

                    <div>
                      <label className="block text-sm text-white/70 mb-1.5 font-medium">Password *</label>
                      <div className="relative">
                        <input
                          className="input-field pr-10"
                          type={showSetupPw ? "text" : "password"}
                          placeholder="••••••••"
                          value={setupPassword}
                          onChange={(e) => setSetupPassword(e.target.value)}
                          required minLength={6} autoComplete="new-password"
                        />
                        <button type="button" onClick={() => setShowSetupPw(!showSetupPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
                          {showSetupPw ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                        </button>
                      </div>
                      <p className="text-white/25 text-xs mt-1">Min 6 characters</p>
                    </div>

                    {setupError && (
                      <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm flex items-start gap-2">
                        <ExclamationCircleIcon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        {setupError}
                      </motion.div>
                    )}

                    <button type="submit" disabled={setupLoading} className="btn-primary w-full py-3">
                      {setupLoading ? "Saving…" : "Save Credentials"}
                    </button>
                  </form>
                </motion.div>
              )}

              {/* ── SCREEN: done ── */}
              {screen === "done" && (
                <motion.div key="done" initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.25 }} className="flex flex-col items-center py-6 text-center">
                  <div className="w-14 h-14 rounded-full bg-green-500/20 flex items-center justify-center mb-3">
                    <CheckCircleIcon className="w-7 h-7 text-green-400" />
                  </div>
                  <p className="text-white font-semibold text-lg">You&apos;re all set!</p>
                  <p className="text-white/40 text-sm mt-1 mb-6">Wallet connected and credentials saved. Sign in anytime with your username and password.</p>
                  <button onClick={onClose} className="btn-primary px-8">Let&apos;s go →</button>
                </motion.div>
              )}

              {/* ── SCREEN: credentials sign-in ── */}
              {screen === "credentials" && (
                <motion.div key="creds" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.22 }}>
                  <button onClick={() => setScreen("connect")} className="flex items-center gap-1.5 text-white/40 hover:text-white/70 text-xs mb-4 transition-colors">
                    <ArrowLeftIcon className="w-3.5 h-3.5" /> Back to connect
                  </button>
                  <p className="text-white/50 text-sm mb-4 leading-relaxed">
                    Use the username and password you created when you first connected your wallet. This restores your wallet identity without needing MetaMask.
                  </p>

                  {credDone ? (
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center py-4 text-center">
                      <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mb-3">
                        <CheckCircleIcon className="w-6 h-6 text-green-400" />
                      </div>
                      <p className="text-white font-semibold">Signed in! Wallet identity restored.</p>
                    </motion.div>
                  ) : (
                    <form onSubmit={handleCredSignIn} className="space-y-4">
                      <div>
                        <label className="block text-sm text-white/70 mb-1.5 font-medium">Username</label>
                        <div className="relative">
                          <UserCircleIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
                          <input
                            className="input-field pl-10"
                            placeholder="your_username"
                            value={credUser}
                            onChange={(e) => setCredUser(e.target.value.toLowerCase())}
                            required autoFocus autoComplete="username" spellCheck={false}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm text-white/70 mb-1.5 font-medium">Password</label>
                        <div className="relative">
                          <input
                            className="input-field pr-10"
                            type={showCredPw ? "text" : "password"}
                            placeholder="••••••••"
                            value={credPass}
                            onChange={(e) => setCredPass(e.target.value)}
                            required autoComplete="current-password"
                          />
                          <button type="button" onClick={() => setShowCredPw(!showCredPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
                            {showCredPw ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {credError && (
                        <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm flex items-start gap-2">
                          <ExclamationCircleIcon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          {credError}
                        </motion.div>
                      )}

                      <button type="submit" disabled={credLoading} className="btn-primary w-full py-3">
                        {credLoading ? "Signing in…" : "Sign In"}
                      </button>
                    </form>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Security footer */}
          <p className="text-white/18 text-[11px] text-center px-6 pb-4">
            🔒 Passwords are SHA-256 hashed and stored locally. Nothing is sent to any server.
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );

  return typeof document !== "undefined" ? createPortal(modal, document.body) : null;
}
