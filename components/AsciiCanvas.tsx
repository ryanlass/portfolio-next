"use client";

import { useEffect, useRef } from "react";
import { ASCII_IMAGE_SOURCES } from "@/lib/ascii-sources";

// Densest → lightest. Symbol + numeral vocabulary (matching the reference
// look) so each density step reads evenly, without busy Latin letterforms.
const ASCII_IMAGE_RAMP = "@#08&96543I2A?!<>=+*/\\:~-_,.·` ";
const ASCII_IMAGE_MAX_DPR = 2;
const ASCII_IMAGE_FRAME_MS = 33;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

type DecodedSource = { width: number; height: number; pixels: Uint8Array; averageLuma: number };
const sourceCache = new Map<string, DecodedSource>();

function getAsciiImageSource(src: string): DecodedSource | null {
  const raw = ASCII_IMAGE_SOURCES[src];
  if (!raw?.rgb) return null;
  if (sourceCache.has(src)) return sourceCache.get(src)!;

  const binary = atob(raw.rgb);
  const pixels = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) pixels[i] = binary.charCodeAt(i);

  let lumaTotal = 0;
  for (let i = 0; i < pixels.length; i += 3) {
    lumaTotal += pixels[i] * 0.2126 + pixels[i + 1] * 0.7152 + pixels[i + 2] * 0.0722;
  }

  const decoded: DecodedSource = {
    width: raw.w,
    height: raw.h,
    pixels,
    averageLuma: lumaTotal / (pixels.length / 3) / 255,
  };
  sourceCache.set(src, decoded);
  return decoded;
}

function drawImageCover(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  width: number,
  height: number,
) {
  const imageRatio = image.naturalWidth / image.naturalHeight;
  const targetRatio = width / height;
  let sourceWidth = image.naturalWidth;
  let sourceHeight = image.naturalHeight;
  let sourceX = 0;
  let sourceY = 0;

  if (imageRatio > targetRatio) {
    sourceWidth = sourceHeight * targetRatio;
    sourceX = (image.naturalWidth - sourceWidth) / 2;
  } else {
    sourceHeight = sourceWidth / targetRatio;
    sourceY = (image.naturalHeight - sourceHeight) / 2;
  }

  ctx.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, width, height);
}

function renderAsciiImageCanvas(
  canvas: HTMLCanvasElement,
  context: CanvasRenderingContext2D,
  sampleCanvas: HTMLCanvasElement,
  sampleContext: CanvasRenderingContext2D,
  image: HTMLImageElement | null,
  src: string,
  prefersReducedMotion: boolean,
  time: number,
) {
  const rect = canvas.getBoundingClientRect();
  const cssWidth = Math.max(1, Math.round(rect.width));
  const cssHeight = Math.max(1, Math.round(rect.height));
  const dpr = Math.min(window.devicePixelRatio || 1, ASCII_IMAGE_MAX_DPR);
  const cellWidth = clamp(cssWidth / 104, 3.9, 6.2);
  const lineHeight = cellWidth * 1.18;
  const columns = Math.ceil(cssWidth / cellWidth);
  const rows = Math.ceil(cssHeight / lineHeight);
  const canvasWidth = Math.round(cssWidth * dpr);
  const canvasHeight = Math.round(cssHeight * dpr);

  if (canvas.width !== canvasWidth || canvas.height !== canvasHeight) {
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
  }

  const precomputed = getAsciiImageSource(src);
  let pixels: Uint8Array | undefined = precomputed?.pixels;
  const sourceWidth = precomputed?.width ?? columns;
  const sourceHeight = precomputed?.height ?? rows;
  const pixelStride = precomputed ? 3 : 4;

  if (!precomputed) {
    if (!image?.complete || !image.naturalWidth) return;
    if (sampleCanvas.width !== columns || sampleCanvas.height !== rows) {
      sampleCanvas.width = columns;
      sampleCanvas.height = rows;
    }
    sampleContext.clearRect(0, 0, columns, rows);
    drawImageCover(sampleContext, image, columns, rows);
    try {
      pixels = sampleContext.getImageData(0, 0, columns, rows).data as unknown as Uint8Array;
    } catch (error) {
      console.warn("Unable to sample image pixels for ASCII rendering.", error);
      return;
    }
  }

  if (!pixels) return;

  const sourceRatio = sourceWidth / sourceHeight;
  const targetRatio = cssWidth / cssHeight;
  const isDarkTheme = document.body.dataset.theme === "dark";
  const useLightCanvas = !isDarkTheme && precomputed && precomputed.averageLuma >= 0.46;
  const invertDensity = !useLightCanvas;
  let cropWidth = sourceWidth;
  let cropHeight = sourceHeight;
  let cropX = 0;
  let cropY = 0;

  if (sourceRatio > targetRatio) {
    cropWidth = cropHeight * targetRatio;
    cropX = (sourceWidth - cropWidth) / 2;
  } else {
    cropHeight = cropWidth / targetRatio;
    cropY = (sourceHeight - cropHeight) / 2;
  }

  context.setTransform(dpr, 0, 0, dpr, 0, 0);
  context.clearRect(0, 0, cssWidth, cssHeight);
  const backgroundTone = useLightCanvas ? 245 : 4;
  context.fillStyle = `rgb(${backgroundTone}, ${backgroundTone}, ${backgroundTone})`;
  context.fillRect(0, 0, cssWidth, cssHeight);
  context.font = `${Math.ceil(cellWidth * 1.36)}px "ABC Diatype", "Courier New", monospace`;
  context.textAlign = "center";
  context.textBaseline = "middle";

  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const sourceColumn = Math.floor(cropX + ((column + 0.5) / columns) * cropWidth);
      const sourceRow = Math.floor(cropY + ((row + 0.5) / rows) * cropHeight);
      const boundedColumn = clamp(sourceColumn, 0, sourceWidth - 1);
      const boundedRow = clamp(sourceRow, 0, sourceHeight - 1);
      const pixelIndex = (boundedRow * sourceWidth + boundedColumn) * pixelStride;
      const red = pixels[pixelIndex];
      const green = pixels[pixelIndex + 1];
      const blue = pixels[pixelIndex + 2];
      const alpha = pixelStride === 4 ? pixels[pixelIndex + 3] / 255 : 1;
      const luma = (red * 0.2126 + green * 0.7152 + blue * 0.0722) / 255;
      // Low spatial frequency so neighbouring cells stay in phase — the
      // motion reads as a slow flowing wave instead of per-cell sparkle.
      const shimmer = prefersReducedMotion
        ? 0.5
        : (Math.sin(time * 0.0016 + column * 0.14 + row * 0.18) + 1) * 0.5;
      const textureSeed = Math.sin((column + 1) * 12.9898 + (row + 1) * 78.233) * 43758.5453;
      const texture = textureSeed - Math.floor(textureSeed);
      const signal = Math.pow(clamp((luma - 0.08) / 0.92, 0, 1), 0.72);
      const ink = invertDensity ? signal : 1 - signal;
      const rampProgress = invertDensity ? 1 - signal : signal;
      const glyphIndex = Math.floor(
        clamp(rampProgress + (texture - 0.5) * 0.12 + (shimmer - 0.5) * 0.06, 0, 0.999) * ASCII_IMAGE_RAMP.length,
      );
      const inkLift = Math.pow(ink, 0.72);
      const displayAlpha = clamp(alpha * (0.006 + Math.pow(ink, 0.82) * 0.96 + shimmer * 0.035 * ink), 0.006, 1);
      const displayTone = useLightCanvas
        ? Math.round(clamp(20 + (1 - inkLift) * 68, 20, 88))
        : Math.round(clamp(232 * inkLift + 10 * signal, 0, 255));

      context.fillStyle = `rgba(${displayTone}, ${displayTone}, ${displayTone}, ${displayAlpha})`;
      context.fillText(
        ASCII_IMAGE_RAMP[glyphIndex],
        column * cellWidth + cellWidth * 0.5,
        row * lineHeight + lineHeight * 0.52,
      );
    }
  }
}

export function AsciiCanvas({
  src,
  alt,
  carouselRoot,
  revealed = false,
  onToggle,
}: {
  src: string;
  alt: string;
  carouselRoot?: HTMLElement | null;
  revealed?: boolean;
  onToggle?: () => void;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Refs so the long-lived main effect can read the latest controlled state
  // and the prop-change effect can drive start/stop without re-running setup.
  const revealedRef = useRef(revealed);
  const visibleRef = useRef(false);
  const startRef = useRef<() => void>(() => {});
  const stopRef = useRef<() => void>(() => {});
  const onToggleRef = useRef(onToggle);
  onToggleRef.current = onToggle;

  // React to controlled `revealed` prop changes: stop the canvas animation
  // when revealed, restart it when un-revealed (if still visible in viewport).
  useEffect(() => {
    revealedRef.current = revealed;
    if (revealed) {
      stopRef.current();
    } else if (visibleRef.current) {
      startRef.current();
    }
  }, [revealed]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const card = cardRef.current;
    if (!canvas || !card) return;

    const context = canvas.getContext("2d");
    const sampleCanvas = document.createElement("canvas");
    const sampleContext = sampleCanvas.getContext("2d", { willReadFrequently: true });
    if (!context || !sampleContext) return;

    const prefersReducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const precomputed = getAsciiImageSource(src);
    const image = precomputed ? null : (imageRef.current ?? new Image());
    if (image && !precomputed) {
      image.decoding = "async";
      image.src = src;
    }

    let animationFrame: number | null = null;
    let lastFrameTime = 0;

    const renderOnce = (time = performance.now()) => {
      if (!precomputed && (!image?.complete || !image.naturalWidth)) return;
      renderAsciiImageCanvas(canvas, context, sampleCanvas, sampleContext, image, src, prefersReducedMotion, time);
    };

    const stop = () => {
      if (!animationFrame) return;
      cancelAnimationFrame(animationFrame);
      animationFrame = null;
    };

    const animate = (time: number) => {
      if (!visibleRef.current || revealedRef.current) {
        animationFrame = null;
        return;
      }
      if (time - lastFrameTime >= ASCII_IMAGE_FRAME_MS) {
        renderOnce(time);
        lastFrameTime = time;
      }
      animationFrame = requestAnimationFrame(animate);
    };

    const start = () => {
      renderOnce();
      if (prefersReducedMotion || revealedRef.current) return;
      if (!animationFrame) animationFrame = requestAnimationFrame(animate);
    };

    startRef.current = start;
    stopRef.current = stop;

    // Defer the heavy canvas re-render until the browser is idle so the
    // theme-toggle click's first paint isn't blocked. Falls back to a
    // generous setTimeout when requestIdleCallback isn't available.
    let themeIdleId: number | null = null;
    let themeTimeoutId: number | null = null;
    const cancelTheme = () => {
      if (themeIdleId !== null) {
        (window as unknown as { cancelIdleCallback?: (id: number) => void }).cancelIdleCallback?.(themeIdleId);
        themeIdleId = null;
      }
      if (themeTimeoutId !== null) {
        clearTimeout(themeTimeoutId);
        themeTimeoutId = null;
      }
    };
    const onThemeChange = () => {
      if (themeIdleId !== null || themeTimeoutId !== null) return;
      const run = () => {
        themeIdleId = null;
        themeTimeoutId = null;
        if (visibleRef.current) renderOnce();
      };
      const ric = (window as unknown as {
        requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      }).requestIdleCallback;
      if (ric) {
        themeIdleId = ric(run, { timeout: 500 });
      } else {
        themeTimeoutId = window.setTimeout(run, 120);
      }
    };
    window.addEventListener("portfolio-theme-change", onThemeChange);

    const resizeObserver = new ResizeObserver(() => {
      if (visibleRef.current || prefersReducedMotion) renderOnce();
    });
    resizeObserver.observe(canvas);

    let visibilityObserver: IntersectionObserver | null = null;
    if ("IntersectionObserver" in window) {
      visibilityObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            visibleRef.current = entry.isIntersecting;
            if (visibleRef.current) start();
            else stop();
          });
        },
        { root: carouselRoot ?? null, rootMargin: "120px" },
      );
      visibilityObserver.observe(canvas);
    } else {
      visibleRef.current = true;
      start();
    }

    if (image && !precomputed) {
      image.addEventListener(
        "load",
        () => {
          if (visibleRef.current) start();
        },
        { once: true },
      );
      if (image.complete && visibleRef.current) start();
    }

    // Tap detection: marquee strip animates and captures the pointer, which
    // breaks the native `click` event. Use pointerdown/pointerup on window
    // and dispatch through the controlled onToggle callback.
    let pointerStart: { x: number; y: number } | null = null;
    let pointerDownOnCard = false;

    const onPointerDown = (event: PointerEvent) => {
      pointerDownOnCard = true;
      pointerStart = { x: event.clientX, y: event.clientY };
    };
    const onWindowPointerUp = (event: PointerEvent) => {
      if (!pointerDownOnCard) return;
      const start = pointerStart;
      pointerDownOnCard = false;
      pointerStart = null;
      if (!start) return;
      const dist = Math.hypot(event.clientX - start.x, event.clientY - start.y);
      if (dist > 8) return;
      onToggleRef.current?.();
    };
    const onWindowPointerCancel = () => {
      pointerDownOnCard = false;
      pointerStart = null;
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      onToggleRef.current?.();
    };

    card.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointerup", onWindowPointerUp);
    window.addEventListener("pointercancel", onWindowPointerCancel);
    card.addEventListener("keydown", onKey);

    return () => {
      window.removeEventListener("portfolio-theme-change", onThemeChange);
      cancelTheme();
      resizeObserver.disconnect();
      visibilityObserver?.disconnect();
      card.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerup", onWindowPointerUp);
      window.removeEventListener("pointercancel", onWindowPointerCancel);
      card.removeEventListener("keydown", onKey);
      stop();
    };
  }, [src, carouselRoot]);

  return (
    <div
      ref={cardRef}
      className={`project-card ascii-image-card${revealed ? " is-revealed" : ""}`}
      role="button"
      tabIndex={0}
      aria-pressed={revealed}
      aria-label={`Reveal ${alt} image`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={imageRef}
        className="project-image"
        src={src}
        alt=""
        loading="lazy"
        decoding="async"
        draggable={false}
      />
      <canvas ref={canvasRef} className="ascii-image-canvas" />
    </div>
  );
}
