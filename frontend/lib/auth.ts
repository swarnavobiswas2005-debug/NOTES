// ── Types ─────────────────────────────────────────────────────────────────────

/** A wallet-linked profile: username + password tied to a wallet address */
export interface WalletProfile {
  walletAddress: string;  // lowercase hex wallet address
  username: string;       // user-chosen display name
  createdAt: string;
}

interface StoredProfile {
  walletAddress: string;
  username: string;
  passwordHash: string;
  createdAt: string;
}

// ── Storage ────────────────────────────────────────────────────────────────────
// Key: username (lowercase) → StoredProfile
const PROFILES_KEY = "notes_wallet_profiles";
// Key: walletAddress (lowercase) → username (for reverse lookup)
const WALLET_INDEX_KEY = "notes_wallet_index";
// Current password-login session
const SESSION_KEY = "notes_wallet_session";

function getProfiles(): Record<string, StoredProfile> {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(localStorage.getItem(PROFILES_KEY) || "{}"); }
  catch { return {}; }
}

function getWalletIndex(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(localStorage.getItem(WALLET_INDEX_KEY) || "{}"); }
  catch { return {}; }
}

function saveProfiles(p: Record<string, StoredProfile>) {
  localStorage.setItem(PROFILES_KEY, JSON.stringify(p));
}

function saveWalletIndex(idx: Record<string, string>) {
  localStorage.setItem(WALLET_INDEX_KEY, JSON.stringify(idx));
}

// ── Crypto ────────────────────────────────────────────────────────────────────
async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

// ── Public API ────────────────────────────────────────────────────────────────

/** Does this wallet already have a registered profile? */
export function walletHasProfile(walletAddress: string): boolean {
  const idx = getWalletIndex();
  return !!idx[walletAddress.toLowerCase()];
}

/** Get the profile linked to a wallet address, or null. */
export function getProfileByWallet(walletAddress: string): WalletProfile | null {
  const idx = getWalletIndex();
  const username = idx[walletAddress.toLowerCase()];
  if (!username) return null;
  const stored = getProfiles()[username];
  if (!stored) return null;
  return { walletAddress: stored.walletAddress, username: stored.username, createdAt: stored.createdAt };
}

/**
 * Register a new wallet profile.
 * Called after the wallet is already connected — links a username + password to the address.
 */
export async function registerWalletProfile(
  walletAddress: string,
  username: string,
  password: string
): Promise<WalletProfile> {
  const addr = walletAddress.toLowerCase();
  const uname = username.trim().toLowerCase();

  if (uname.length < 3) throw new Error("Username must be at least 3 characters.");
  if (!/^[a-z0-9_]+$/.test(uname)) throw new Error("Username can only contain letters, numbers, and underscores.");
  if (password.length < 6) throw new Error("Password must be at least 6 characters.");

  const profiles = getProfiles();
  const idx = getWalletIndex();

  if (profiles[uname]) throw new Error("Username already taken. Choose another.");
  if (idx[addr]) throw new Error("This wallet already has a profile. Sign in with your username and password.");

  const passwordHash = await sha256(password);
  const profile: StoredProfile = {
    walletAddress: addr,
    username: uname,
    passwordHash,
    createdAt: new Date().toISOString(),
  };

  profiles[uname] = profile;
  idx[addr] = uname;
  saveProfiles(profiles);
  saveWalletIndex(idx);

  const result: WalletProfile = { walletAddress: addr, username: uname, createdAt: profile.createdAt };
  localStorage.setItem(SESSION_KEY, JSON.stringify(result));
  return result;
}

/**
 * Sign in using username + password (no wallet needed in the browser).
 * Returns the wallet-linked profile so the app knows which wallet this user owns.
 */
export async function loginWithWalletPassword(
  username: string,
  password: string
): Promise<WalletProfile> {
  const uname = username.trim().toLowerCase();
  const profiles = getProfiles();
  const stored = profiles[uname];

  if (!stored) throw new Error("No profile found with that username.");
  const hash = await sha256(password);
  if (hash !== stored.passwordHash) throw new Error("Incorrect password. Please try again.");

  const result: WalletProfile = {
    walletAddress: stored.walletAddress,
    username: stored.username,
    createdAt: stored.createdAt,
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(result));
  return result;
}

/** Clear the password-login session. */
export function clearSession(): void {
  if (typeof window !== "undefined") localStorage.removeItem(SESSION_KEY);
}

/** Restore a password-login session from localStorage. */
export function getSession(): WalletProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as WalletProfile) : null;
  } catch { return null; }
}

/** Initials for avatar display (max 2 chars). */
export function getInitials(name: string): string {
  const parts = name.trim().split(/[\s_]+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
