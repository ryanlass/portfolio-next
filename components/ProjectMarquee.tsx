"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AsciiCanvas } from "./AsciiCanvas";

export type MarqueeItem = {
  src: string;
  alt: string;
  width: 240 | 360 | 480 | 500 | 640;
  slug?: string;
};

const widthClass = (width: MarqueeItem["width"]) => `project-w${width}`;

export function ProjectMarquee({ items }: { items: MarqueeItem[] }) {
  const marqueeRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [marqueeRoot, setMarqueeRoot] = useState<HTMLDivElement | null>(null);
  // Single source of truth — only one card can be revealed across both
  // marquee passes. Tapping a different card replaces this; tapping the
  // same card un-reveals.
  const [revealedSrc, setRevealedSrc] = useState<string | null>(null);

  useEffect(() => {
    setMarqueeRoot(marqueeRef.current);
  }, []);

  const toggleReveal = useCallback((src: string) => {
    setRevealedSrc((prev) => (prev === src ? null : src));
  }, []);

  useEffect(() => {
    const marquee = marqueeRef.current;
    const track = trackRef.current;
    if (!marquee || !track) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const baseSpeed = 28;
    const DRAG_THRESHOLD = 6;
    let setWidth = 1;
    let offset = 0;
    let velocity = baseSpeed;
    let dragging = false;
    let pointerDown = false;
    let captured = false;
    let pointerStartX = 0;
    let pointerStartY = 0;
    let pointerId: number | null = null;
    let lastPointerX = 0;
    let lastPointerTime = 0;
    let lastFrame = performance.now();
    let rafId = 0;

    const wrapOffset = () => {
      offset = ((offset % setWidth) + setWidth) % setWidth;
    };

    const measure = () => {
      const style = getComputedStyle(track);
      const gap = parseFloat(style.columnGap || style.gap || "0");
      const childCount = track.children.length;
      const halfCount = childCount / 2;
      let width = 0;
      for (let i = 0; i < halfCount; i += 1) {
        const child = track.children[i] as HTMLElement;
        width += child.getBoundingClientRect().width + gap;
      }
      setWidth = width || 1;
      wrapOffset();
    };

    const tick = (time: number) => {
      const delta = Math.min((time - lastFrame) / 1000, 0.05);
      lastFrame = time;
      if (!pointerDown && !dragging) {
        velocity *= Math.pow(0.992, delta * 60);
        velocity += (baseSpeed - velocity) * Math.min(delta * 1.8, 1);
        offset += velocity * delta;
      }
      wrapOffset();
      track.style.transform = `translate3d(${-offset}px,0,0)`;
      rafId = requestAnimationFrame(tick);
    };

    const onPointerDown = (event: PointerEvent) => {
      pointerDown = true;
      dragging = false;
      captured = false;
      pointerId = event.pointerId;
      pointerStartX = event.clientX;
      pointerStartY = event.clientY;
      lastPointerX = event.clientX;
      lastPointerTime = performance.now();
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!pointerDown || event.pointerId !== pointerId) return;
      if (!dragging) {
        const dist = Math.hypot(event.clientX - pointerStartX, event.clientY - pointerStartY);
        if (dist < DRAG_THRESHOLD) return;
        dragging = true;
        marquee.classList.add("is-dragging");
        try {
          marquee.setPointerCapture(event.pointerId);
          captured = true;
        } catch {}
      }
      const now = performance.now();
      const deltaX = event.clientX - lastPointerX;
      const deltaTime = Math.max((now - lastPointerTime) / 1000, 0.016);
      offset -= deltaX;
      velocity = velocity * 0.35 + (-deltaX / deltaTime) * 0.65;
      wrapOffset();
      lastPointerX = event.clientX;
      lastPointerTime = now;
    };

    const releaseDrag = (event: PointerEvent) => {
      if (!pointerDown || event.pointerId !== pointerId) return;
      pointerDown = false;
      dragging = false;
      pointerId = null;
      if (captured) {
        try {
          marquee.releasePointerCapture(event.pointerId);
        } catch {}
        captured = false;
      }
      marquee.classList.remove("is-dragging");
    };

    const onLostCapture = () => {
      pointerDown = false;
      dragging = false;
      pointerId = null;
      captured = false;
      marquee.classList.remove("is-dragging");
    };

    const onWheel = (event: WheelEvent) => {
      const impulse = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
      if (marquee.contains(event.target as Node)) {
        event.preventDefault();
      }
      offset += impulse * 0.85;
      velocity += impulse * 0.18;
      wrapOffset();
    };

    let lastScrollY = window.scrollY;
    const onScroll = () => {
      const currentY = window.scrollY;
      const delta = currentY - lastScrollY;
      lastScrollY = currentY;
      if (delta === 0) return;
      offset += delta * 0.85;
      velocity += delta * 0.18;
      wrapOffset();
    };

    marquee.addEventListener("pointerdown", onPointerDown);
    marquee.addEventListener("pointermove", onPointerMove);
    marquee.addEventListener("pointerup", releaseDrag);
    marquee.addEventListener("pointercancel", releaseDrag);
    marquee.addEventListener("lostpointercapture", onLostCapture);
    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("scroll", onScroll, { passive: true });

    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(track);
    resizeObserver.observe(marquee);
    measure();
    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      marquee.removeEventListener("pointerdown", onPointerDown);
      marquee.removeEventListener("pointermove", onPointerMove);
      marquee.removeEventListener("pointerup", releaseDrag);
      marquee.removeEventListener("pointercancel", releaseDrag);
      marquee.removeEventListener("lostpointercapture", onLostCapture);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  // Render the items twice for an infinite-loop visual; the second pass is aria-hidden.
  return (
    <section className="projects" aria-label="Selected projects">
      <div className="project-marquee" ref={marqueeRef}>
        <div className="project-strip" ref={trackRef}>
          {items.map((item, idx) => (
            <article key={`a-${idx}`} className={`project ${widthClass(item.width)}`}>
              <AsciiCanvas
                src={item.src}
                alt={item.alt}
                carouselRoot={marqueeRoot}
                revealed={revealedSrc === item.src}
                onToggle={() => toggleReveal(item.src)}
              />
            </article>
          ))}
          {items.map((item, idx) => (
            <article key={`b-${idx}`} className={`project ${widthClass(item.width)}`} aria-hidden="true">
              <AsciiCanvas
                src={item.src}
                alt={item.alt}
                carouselRoot={marqueeRoot}
                revealed={revealedSrc === item.src}
                onToggle={() => toggleReveal(item.src)}
              />
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
