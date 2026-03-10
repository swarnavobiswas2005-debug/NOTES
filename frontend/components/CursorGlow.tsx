"use client";

import { useEffect, useRef, useState } from "react";

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  size: number;
  color: string;
}

const PARTICLE_COLORS = ["#818cf8", "#a78bfa", "#c4b5fd", "#6366f1", "#e879f9"];

export function CursorGlow() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [isHovering, setIsHovering] = useState(false);

  const mouse = useRef({ x: -200, y: -200 });
  const ring = useRef({ x: -200, y: -200 });
  const rafId = useRef<number | null>(null);
  const particleId = useRef(0);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mouse.current = { x: e.clientX, y: e.clientY };
    };

    const onEnter = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("button, a, input, textarea, select, [data-cursor-hover]")) {
        setIsHovering(true);
      }
    };

    const onLeave = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("button, a, input, textarea, select, [data-cursor-hover]")) {
        setIsHovering(false);
      }
    };

    const onClick = (e: MouseEvent) => {
      const count = 8;
      const newParticles: Particle[] = Array.from({ length: count }, (_, i) => {
        const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5;
        const speed = 2 + Math.random() * 3;
        return {
          id: particleId.current++,
          x: e.clientX,
          y: e.clientY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 1,
          size: 3 + Math.random() * 4,
          color: PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)],
        };
      });
      setParticles((prev) => [...prev, ...newParticles]);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseover", onEnter);
    window.addEventListener("mouseout", onLeave);
    window.addEventListener("click", onClick);

    // Lerp animation loop
    let last = performance.now();
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

    const animate = (now: number) => {
      const dt = Math.min((now - last) / 16.67, 3); // cap at 3x frame
      last = now;

      ring.current.x = lerp(ring.current.x, mouse.current.x, 0.12 * dt);
      ring.current.y = lerp(ring.current.y, mouse.current.y, 0.12 * dt);

      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${mouse.current.x - 5}px, ${mouse.current.y - 5}px)`;
      }
      if (ringRef.current) {
        ringRef.current.style.transform = `translate(${ring.current.x - 20}px, ${ring.current.y - 20}px)`;
      }

      // Decay particles
      setParticles((prev) =>
        prev
          .map((p) => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            vy: p.vy + 0.12,
            life: p.life - 0.045,
          }))
          .filter((p) => p.life > 0)
      );

      rafId.current = requestAnimationFrame(animate);
    };

    rafId.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseover", onEnter);
      window.removeEventListener("mouseout", onLeave);
      window.removeEventListener("click", onClick);
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, []);

  return (
    <>
      {/* Inner dot */}
      <div
        ref={dotRef}
        className="cursor-dot"
        aria-hidden="true"
      />

      {/* Outer ring */}
      <div
        ref={ringRef}
        className={`cursor-ring ${isHovering ? "cursor-ring--hover" : ""}`}
        aria-hidden="true"
      />

      {/* Click particles */}
      {particles.map((p) => (
        <div
          key={p.id}
          aria-hidden="true"
          style={{
            position: "fixed",
            left: 0,
            top: 0,
            pointerEvents: "none",
            zIndex: 99999,
            transform: `translate(${p.x - p.size / 2}px, ${p.y - p.size / 2}px)`,
            width: p.size,
            height: p.size,
            borderRadius: "50%",
            background: p.color,
            opacity: p.life,
            boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
          }}
        />
      ))}
    </>
  );
}
