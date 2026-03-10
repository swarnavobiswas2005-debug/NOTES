"use client";

import { useEffect, useRef } from "react";

export function ScrollProgress() {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const update = () => {
      const scrolled = window.scrollY;
      const total = document.documentElement.scrollHeight - window.innerHeight;
      const pct = total > 0 ? (scrolled / total) * 100 : 0;
      if (barRef.current) {
        barRef.current.style.width = `${pct}%`;
      }
    };
    window.addEventListener("scroll", update, { passive: true });
    update();
    return () => window.removeEventListener("scroll", update);
  }, []);

  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: "3px",
        zIndex: 99998,
        background: "transparent",
        pointerEvents: "none",
      }}
    >
      <div
        ref={barRef}
        style={{
          height: "100%",
          width: "0%",
          background: "linear-gradient(90deg, #6366f1, #a78bfa, #e879f9)",
          boxShadow: "0 0 10px rgba(99,102,241,0.8), 0 0 20px rgba(167,139,250,0.5)",
          transition: "width 0.1s linear",
          borderRadius: "0 2px 2px 0",
        }}
      />
    </div>
  );
}
