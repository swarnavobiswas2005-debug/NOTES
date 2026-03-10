import type { Config } from "tailwindcss";

// Tailwind v4: all theme tokens are defined in globals.css via @theme.
// This file is kept minimal for v4 compatibility.
const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
};
export default config;
