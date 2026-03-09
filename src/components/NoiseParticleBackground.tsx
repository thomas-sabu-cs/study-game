"use client";

import { useRef, useEffect } from "react";

// Minimal 2D Perlin-like noise (permutation + gradient), returns 0..1
const PERM = new Uint8Array(512);
const SEED = 99;
(function () {
  const p = new Uint8Array(256);
  for (let i = 0; i < 256; i++) p[i] = i;
  let n = 256;
  let s = SEED;
  const rand = () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
  while (n > 1) {
    const k = Math.floor(rand() * n--);
    [p[n], p[k]] = [p[k], p[n]];
  }
  for (let i = 0; i < 512; i++) PERM[i] = p[i & 255];
})();

function fade(t: number) {
  return t * t * t * (t * (t * 6 - 15) + 10);
}
function lerp(a: number, b: number, t: number) {
  return a + t * (b - a);
}
function grad(hash: number, x: number, y: number) {
  const h = hash & 3;
  const u = h < 2 ? x : y;
  const v = h < 2 ? y : x;
  return ((h & 1) ? -u : u) + ((h & 2) ? -v : v) * 0.5;
}

function perlin2(x: number, y: number): number {
  const X = Math.floor(x) & 255;
  const Y = Math.floor(y) & 255;
  x -= Math.floor(x);
  y -= Math.floor(y);
  const u = fade(x);
  const v = fade(y);
  const aa = PERM[PERM[X] + Y];
  const ab = PERM[PERM[X] + Y + 1];
  const ba = PERM[PERM[X + 1] + Y];
  const bb = PERM[PERM[X + 1] + Y + 1];
  return lerp(
    lerp(grad(aa, x, y), grad(ba, x - 1, y), u),
    lerp(grad(ab, x, y - 1), grad(bb, x - 1, y - 1), u),
    v
  );
}

// Map perlin [-0.5..0.5] approx to 0..1
function noise(x: number, y: number): number {
  return (perlin2(x, y) + 0.5) % 1;
}

const TAU = Math.PI * 2;
const NUM_PARTICLES = 1400;
const NOISE_SCALE = 0.01;
const TRAIL_ALPHA = 0.07;
const PARTICLE_SPEED = 0.28;
// Pastel sage green (#a5d6a7)
const BG_R = 165;
const BG_G = 214;
const BG_B = 167;
// Default: pastel pink (#f8bbd9). Unlocked: white.
const PINK = "rgb(248, 187, 217)";
const WHITE = "rgb(255, 255, 255)";

export function NoiseParticleBackground({ rainbowUnlocked }: { rainbowUnlocked: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<{ x: number; y: number }[]>([]);
  const mouseRef = useRef({ x: -1000, y: -1000, pressed: false });
  const particleColorRef = useRef(rainbowUnlocked ? WHITE : PINK);
  particleColorRef.current = rainbowUnlocked ? WHITE : PINK;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    let rafId: number;

    function resize() {
      const el = canvasRef.current;
      if (!el) return;
      width = window.innerWidth;
      height = window.innerHeight;
      el.width = width;
      el.height = height;
      if (particlesRef.current.length === 0) {
        particlesRef.current = Array.from({ length: NUM_PARTICLES }, () => ({
          x: Math.random() * width,
          y: Math.random() * height,
        }));
      } else {
        for (const p of particlesRef.current) {
          if (p.x < 0 || p.x > width || p.y < 0 || p.y > height) {
            p.x = Math.random() * width;
            p.y = Math.random() * height;
          }
        }
      }
    }

    let firstFrame = true;
    function draw() {
      const context = canvasRef.current?.getContext("2d");
      if (!context) return;
      if (firstFrame) {
        context.fillStyle = `rgb(${BG_R}, ${BG_G}, ${BG_B})`;
        context.fillRect(0, 0, width, height);
        firstFrame = false;
      }
      context.fillStyle = `rgba(${BG_R}, ${BG_G}, ${BG_B}, ${TRAIL_ALPHA})`;
      context.fillRect(0, 0, width, height);

      context.fillStyle = particleColorRef.current;

      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;
      const mousePressed = mouseRef.current.pressed;

      for (let i = 0; i < particlesRef.current.length; i++) {
        const p = particlesRef.current[i];
        let a: number;

        if (mousePressed && mx >= 0 && my >= 0) {
          const dx = p.x - mx;
          const dy = p.y - my;
          a = Math.atan2(dy, dx);
        } else {
          const n = noise(p.x * NOISE_SCALE, p.y * NOISE_SCALE);
          a = TAU * n;
        }

        p.x += Math.cos(a) * PARTICLE_SPEED;
        p.y += Math.sin(a) * PARTICLE_SPEED;

        if (p.x < 0 || p.x > width || p.y < 0 || p.y > height) {
          p.x = Math.random() * width;
          p.y = Math.random() * height;
        }

        context.fillRect(Math.floor(p.x), Math.floor(p.y), 1, 1);
      }

      rafId = requestAnimationFrame(draw);
    }

    resize();
    draw();

    const onPointerMove = (e: PointerEvent) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
    };
    const onPointerDown = () => {
      mouseRef.current.pressed = true;
    };
    const onPointerUp = () => {
      mouseRef.current.pressed = false;
    };
    const onPointerLeave = () => {
      mouseRef.current.x = -1000;
      mouseRef.current.y = -1000;
      mouseRef.current.pressed = false;
    };

    document.addEventListener("pointermove", onPointerMove, { passive: true });
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("pointerup", onPointerUp);
    document.addEventListener("pointerleave", onPointerLeave);
    window.addEventListener("resize", resize);

    return () => {
      cancelAnimationFrame(rafId);
      document.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("pointerup", onPointerUp);
      document.removeEventListener("pointerleave", onPointerLeave);
      window.removeEventListener("resize", resize);
    };
  }, [rainbowUnlocked]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 w-full h-full"
      style={{ display: "block" }}
      aria-hidden
    />
  );
}
