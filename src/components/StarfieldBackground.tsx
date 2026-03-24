"use client";

import { useEffect, useRef } from "react";

const STAR_COLOR_DARK = "#ffffff";
const STAR_COLOR_LIGHT = "#000000";
const STAR_SIZE = 3;
const STAR_MIN_SCALE = 0.2;
const OVERFLOW_THRESHOLD = 50;

type Star = { x: number; y: number; z: number };

export function StarfieldBackground({ variant = "dark" }: { variant?: "dark" | "light" }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    let width = 0;
    let height = 0;
    const scale = 1;
    let stars: Star[] = [];
    let pointerX: number | null | undefined;
    let pointerY: number | null | undefined;
    let touchInput = false;
    const velocity = { x: 0, y: 0, tx: 0, ty: 0, z: 0.0005 };
    let frameId = 0;

    const STAR_COUNT = (window.innerWidth + window.innerHeight) / 8;

    function placeStar(star: Star) {
      star.x = Math.random() * width;
      star.y = Math.random() * height;
    }

    function recycleStar(star: Star) {
      let direction: "z" | "l" | "r" | "t" | "b" = "z";
      const vx = Math.abs(velocity.x);
      const vy = Math.abs(velocity.y);
      if (vx > 1 || vy > 1) {
        let axis: "h" | "v";
        if (vx > vy) {
          axis = Math.random() < vx / (vx + vy) ? "h" : "v";
        } else {
          axis = Math.random() < vy / (vx + vy) ? "v" : "h";
        }
        if (axis === "h") direction = velocity.x > 0 ? "l" : "r";
        else direction = velocity.y > 0 ? "t" : "b";
      }
      star.z = STAR_MIN_SCALE + Math.random() * (1 - STAR_MIN_SCALE);
      if (direction === "z") {
        star.z = 0.1;
        star.x = Math.random() * width;
        star.y = Math.random() * height;
      } else if (direction === "l") {
        star.x = -OVERFLOW_THRESHOLD;
        star.y = height * Math.random();
      } else if (direction === "r") {
        star.x = width + OVERFLOW_THRESHOLD;
        star.y = height * Math.random();
      } else if (direction === "t") {
        star.x = width * Math.random();
        star.y = -OVERFLOW_THRESHOLD;
      } else if (direction === "b") {
        star.x = width * Math.random();
        star.y = height + OVERFLOW_THRESHOLD;
      }
    }

    function resize() {
      const el = canvasRef.current;
      if (!el) return;
      width = window.innerWidth;
      height = window.innerHeight;
      el.width = width;
      el.height = height;
      if (!stars.length) {
        stars = [];
        for (let i = 0; i < STAR_COUNT; i++) {
          const star: Star = { x: 0, y: 0, z: STAR_MIN_SCALE + Math.random() * (1 - STAR_MIN_SCALE) };
          placeStar(star);
          stars.push(star);
        }
      } else {
        stars.forEach(placeStar);
      }
    }

    function movePointer(x: number, y: number) {
      if (typeof pointerX === "number" && typeof pointerY === "number") {
        const ox = x - pointerX;
        const oy = y - pointerY;
        velocity.tx = velocity.tx + (ox / (8 * scale)) * (touchInput ? 1 : -1);
        velocity.ty = velocity.ty + (oy / (8 * scale)) * (touchInput ? 1 : -1);
      }
      pointerX = x;
      pointerY = y;
    }

    function onMouseMove(event: MouseEvent) {
      touchInput = false;
      movePointer(event.clientX, event.clientY);
    }

    function onTouchMove(event: TouchEvent) {
      touchInput = true;
      const t = event.touches[0];
      movePointer(t.clientX, t.clientY);
    }

    function onMouseLeave() {
      pointerX = null;
      pointerY = null;
    }

    function update() {
      velocity.tx *= 0.96;
      velocity.ty *= 0.96;
      velocity.x += (velocity.tx - velocity.x) * 0.8;
      velocity.y += (velocity.ty - velocity.y) * 0.8;
      stars.forEach((star) => {
        star.x += velocity.x * star.z;
        star.y += velocity.y * star.z;
        star.x += (star.x - width / 2) * velocity.z * star.z;
        star.y += (star.y - height / 2) * velocity.z * star.z;
        star.z += velocity.z;
        if (
          star.x < -OVERFLOW_THRESHOLD ||
          star.x > width + OVERFLOW_THRESHOLD ||
          star.y < -OVERFLOW_THRESHOLD ||
          star.y > height + OVERFLOW_THRESHOLD
        ) {
          recycleStar(star);
        }
      });
    }

    function render() {
      const ctx = canvasRef.current?.getContext("2d");
      if (!ctx) return;
      const starColor = variant === "light" ? STAR_COLOR_LIGHT : STAR_COLOR_DARK;
      ctx.clearRect(0, 0, width, height);
      stars.forEach((star) => {
        ctx.beginPath();
        ctx.lineCap = "round";
        ctx.lineWidth = STAR_SIZE * star.z * scale;
        ctx.globalAlpha = 0.5 + 0.5 * Math.random();
        ctx.strokeStyle = starColor;
        ctx.beginPath();
        ctx.moveTo(star.x, star.y);
        let tailX = velocity.x * 2;
        let tailY = velocity.y * 2;
        if (Math.abs(tailX) < 0.1) tailX = 0.5;
        if (Math.abs(tailY) < 0.1) tailY = 0.5;
        ctx.lineTo(star.x + tailX, star.y + tailY);
        ctx.stroke();
      });
    }

    function step() {
      update();
      render();
      frameId = requestAnimationFrame(step);
    }

    resize();
    step();

    window.addEventListener("resize", resize);
    // Listen on window so interaction still works even if other layers cover the canvas.
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onMouseLeave);
    document.addEventListener("mouseleave", onMouseLeave);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onMouseLeave);
      document.removeEventListener("mouseleave", onMouseLeave);
    };
  }, [variant]);

  return (
    <div
      className="pointer-events-none fixed inset-0 z-0"
      aria-hidden
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: variant === "light" ? "#e0fff5" : "#000000",
        backgroundImage:
          variant === "light"
            ? "radial-gradient(circle at top right, rgba(0, 128, 128, 0.08), transparent), radial-gradient(circle at 20% 80%, rgba(0, 200, 180, 0.08), transparent)"
            : "radial-gradient(circle at top right, rgba(121, 68, 154, 0.13), transparent), radial-gradient(circle at 20% 80%, rgba(41, 196, 255, 0.13), transparent)",
      }}
    >
      <canvas ref={canvasRef} className="pointer-events-auto w-full h-full" />
    </div>
  );
}

