"use client";

import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";
import { useAccount } from "wagmi";
import {
  WalletProfile,
  getSession,
  clearSession,
  getProfileByWallet,
  walletHasProfile,
  getInitials,
} from "@/lib/auth";

// ── Ghost session constant ─────────────────────────────────────────────────────
const GHOST_WALLET = "0x6700570000000000000000000000000000000000"; // fake addr
const GHOST_PROFILE: WalletProfile = {
  walletAddress: GHOST_WALLET,
  username: "ghost",
  createdAt: new Date().toISOString(),
};

// ── Context shape ─────────────────────────────────────────────────────────────
interface AuthContextValue {
  walletAddress: string | null;
  username: string | null;
  isWalletConnected: boolean;
  isPasswordSession: boolean;
  isGhostSession: boolean;
  needsProfile: boolean;
  setProfile: (p: WalletProfile | null) => void;
  logout: () => void;
  /** Programmatically toggle ghost mode (for mobile tap gesture) */
  toggleGhost: () => void;
  initials: string;
  ready: boolean;
}

const AuthContext = createContext<AuthContextValue>({
  walletAddress: null,
  username: null,
  isWalletConnected: false,
  isPasswordSession: false,
  isGhostSession: false,
  needsProfile: false,
  setProfile: () => {},
  logout: () => {},
  toggleGhost: () => {},
  initials: "",
  ready: false,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const { address, isConnected } = useAccount();
  const [passwordProfile, setPasswordProfile] = useState<WalletProfile | null>(null);
  const [ghostActive, setGhostActive] = useState(false);
  const [ready, setReady] = useState(false);

  // Restore password session on mount
  useEffect(() => {
    const session = getSession();
    if (session) setPasswordProfile(session);
    setReady(true);
  }, []);

  // ── Double-Ctrl ghost mode ─────────────────────────────────────────────────
  const lastCtrlTime = useRef<number>(0);
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key !== "Control") return;
      const now = Date.now();
      if (now - lastCtrlTime.current < 500) {
        // Double Ctrl within 500 ms → toggle ghost
        setGhostActive((prev) => {
          const next = !prev;
          // Brief visual flash on the document title
          const original = document.title;
          document.title = next ? "👻 Ghost Mode ON" : "🚫 Ghost Mode OFF";
          setTimeout(() => { document.title = original; }, 1500);
          return next;
        });
        lastCtrlTime.current = 0; // reset so triple doesn't re-trigger
      } else {
        lastCtrlTime.current = now;
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  // ── Derived auth state ─────────────────────────────────────────────────────
  const isWalletConnected = isConnected && !!address && !ghostActive;
  const isPasswordSession = !isWalletConnected && !!passwordProfile && !ghostActive;
  const isGhostSession = ghostActive;

  const walletProfile = isWalletConnected ? getProfileByWallet(address!) : null;

  const walletAddress: string | null = isGhostSession
    ? GHOST_WALLET
    : isWalletConnected
    ? address!.toLowerCase()
    : passwordProfile?.walletAddress ?? null;

  const username: string | null = isGhostSession
    ? "ghost"
    : isWalletConnected
    ? (walletProfile?.username ?? null)
    : passwordProfile?.username ?? null;

  const needsProfile = isWalletConnected && !isGhostSession && walletHasProfile !== undefined && !walletHasProfile(address!);

  const initials = isGhostSession
    ? "👻"
    : username
    ? getInitials(username)
    : address
    ? address.slice(2, 4).toUpperCase()
    : "";

  const setProfile = (p: WalletProfile | null) => setPasswordProfile(p);

  const toggleGhost = () => {
    setGhostActive((prev) => {
      const next = !prev;
      const original = document.title;
      document.title = next ? "👻 Ghost Mode ON" : "🚫 Ghost Mode OFF";
      setTimeout(() => { document.title = original; }, 1500);
      return next;
    });
  };

  const logout = () => {
    clearSession();
    setPasswordProfile(null);
    setGhostActive(false);
  };

  return (
    <AuthContext.Provider value={{
      walletAddress,
      username,
      isWalletConnected,
      isPasswordSession,
      isGhostSession,
      needsProfile,
      setProfile,
      logout,
      toggleGhost,
      initials,
      ready,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
