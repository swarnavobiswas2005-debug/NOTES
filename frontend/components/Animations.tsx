"use client";

import { useEffect, useRef } from "react";

// ── Twinkling star field ──────────────────────────────────────────────────────
export function StarField({ count = 60 }: { count?: number }) {
  const stars = Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 2 + 0.5,
    delay: Math.random() * 6,
    duration: 2 + Math.random() * 4,
  }));

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
      {stars.map((s) => (
        <span
          key={s.id}
          className="absolute rounded-full bg-white"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: `${s.size}px`,
            height: `${s.size}px`,
            animation: `twinkle ${s.duration}s ease-in-out ${s.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

// ── Meteor shower ─────────────────────────────────────────────────────────────
interface Meteor {
  id: number;
  top: number;
  left: number;
  duration: number;
  delay: number;
}

export function MeteorShower({ count = 8 }: { count?: number }) {
  const meteors: Meteor[] = Array.from({ length: count }, (_, i) => ({
    id: i,
    top:  Math.random() * 40,
    left: 20 + Math.random() * 80,
    duration: 1.5 + Math.random() * 2,
    delay: i * 1.4 + Math.random() * 2,
  }));

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
      {meteors.map((m) => (
        <span
          key={m.id}
          className="meteor"
          style={{
            top: `${m.top}%`,
            left: `${m.left}%`,
            animationDuration: `${m.duration}s`,
            animationDelay: `${m.delay}s`,
          }}
        />
      ))}
    </div>
  );
}

// ── Animated gradient orbs ────────────────────────────────────────────────────
export function FloatingOrbs() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
      <div
        className="absolute rounded-full blur-[120px] opacity-20"
        style={{
          width: 520, height: 520,
          background: "radial-gradient(circle, #6366f1, transparent 70%)",
          top: "10%", left: "-5%",
          animation: "floatX 14s ease-in-out infinite",
        }}
      />
      <div
        className="absolute rounded-full blur-[100px] opacity-15"
        style={{
          width: 400, height: 400,
          background: "radial-gradient(circle, #a78bfa, transparent 70%)",
          top: "50%", right: "-8%",
          animation: "floatX 18s ease-in-out 3s infinite reverse",
        }}
      />
      <div
        className="absolute rounded-full blur-[140px] opacity-10"
        style={{
          width: 600, height: 600,
          background: "radial-gradient(circle, #ec4899, transparent 70%)",
          bottom: "0%", left: "30%",
          animation: "floatX 22s ease-in-out 6s infinite",
        }}
      />
    </div>
  );
}

// ── Animated dot grid (scoped, for specific sections) ─────────────────────────
export function DotGrid({ className = "" }: { className?: string }) {
  return (
    <div
      className={`absolute inset-0 dot-grid pointer-events-none ${className}`}
      aria-hidden="true"
    />
  );
}

// ── Scan line (terminal / code window vibes) ──────────────────────────────────
export function ScanLine() {
  return <div className="scan-line" aria-hidden="true" />;
}

// ── Count-up number ───────────────────────────────────────────────────────────
export function CountUp({ target, suffix = "", duration = 2000 }: { target: number; suffix?: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || started.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || started.current) return;
        started.current = true;
        const start = performance.now();
        const tick = (now: number) => {
          const elapsed = now - start;
          const progress = Math.min(elapsed / duration, 1);
          const ease = 1 - Math.pow(1 - progress, 3);
          el.textContent = Math.round(ease * target).toLocaleString() + suffix;
          if (progress < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [target, suffix, duration]);

  return <span ref={ref}>0{suffix}</span>;
}
