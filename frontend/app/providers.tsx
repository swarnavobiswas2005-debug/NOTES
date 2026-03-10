"use client";

import "@rainbow-me/rainbowkit/styles.css";
import { getDefaultConfig, RainbowKitProvider, darkTheme, DisclaimerComponent } from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import { polygonAmoy } from "wagmi/chains";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { ReactNode } from "react";
import { AuthProvider } from "@/context/AuthContext";

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 60_000, retry: 1 } },
});

// Use env var if set and valid, otherwise use RainbowKit's public fallback demo ID
const PROJECT_ID =
  process.env.NEXT_PUBLIC_RAINBOWKIT_PROJECT_ID &&
  process.env.NEXT_PUBLIC_RAINBOWKIT_PROJECT_ID !== "placeholder"
    ? process.env.NEXT_PUBLIC_RAINBOWKIT_PROJECT_ID
    : "3a8170812b534d0ff9d794f19a901d64"; // RainbowKit demo ID (avoids 403 errors in dev)

// App URL — WalletConnect v2 requires this to generate a proper deeplink / QR URI
const APP_URL =
  typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";

const config = getDefaultConfig({
  appName: "NOTES — Decentralized Academic Notes",
  appUrl: APP_URL,
  appDescription: "Upload, verify and share academic notes on-chain. Powered by Polygon Amoy.",
  projectId: PROJECT_ID,
  chains: [polygonAmoy],
  ssr: true,
});

const customDark = darkTheme({
  accentColor: "#6366f1",
  accentColorForeground: "white",
  borderRadius: "large",
  overlayBlur: "small",
});

const Disclaimer: DisclaimerComponent = ({ Text, Link }) => (
  <Text>
    Connect your wallet to upload and verify academic notes on chain.{" "}
    <Link href="https://polygon.technology">Powered by Polygon Amoy.</Link>
  </Text>
);

export function Providers({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={customDark}
          modalSize="compact"
          appInfo={{ disclaimer: Disclaimer, appName: "NOTES" }}
        >
          <AuthProvider>
            {children}
          </AuthProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
