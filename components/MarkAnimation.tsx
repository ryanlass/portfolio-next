"use client";

import { useEffect, useRef, useState } from "react";

const MARK_FRAMES = Array.from({ length: 18 }, (_, i) => `/marks/Property%201=${i + 1}.svg`);

export function MarkAnimation() {
  const [src, setSrc] = useState(MARK_FRAMES[0]);
  const indexRef = useRef(0);

  useEffect(() => {
    MARK_FRAMES.forEach((href) => {
      const preload = new Image();
      preload.src = href;
    });

    const interval = setInterval(() => {
      indexRef.current = (indexRef.current + 1) % MARK_FRAMES.length;
      setSrc(MARK_FRAMES[indexRef.current]);
    }, 200);

    return () => clearInterval(interval);
  }, []);

  return (
    <a className="mark" href="/" aria-label="Ryan Lasswell home">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="mark-frame" src={src} alt="" />
    </a>
  );
}
