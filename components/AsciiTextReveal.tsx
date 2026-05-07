"use client";

import { useEffect, useRef, type ReactNode } from "react";

const ASCII_REVEAL_RAMP = "$MBNQØW@&R8GD6S9ÖOH#ÉE5UK0ÄÅA2XP34ZC%VIF17YTJL[]?}{()<>|=+\\/^!\";*_:~,'-.·` ";
const ASCII_REVEAL_RAMP_LOWER = ASCII_REVEAL_RAMP.toLowerCase().replace(/[0-9@&#$%()[\]{}|\\/?!;*^]/g, "");
const ASCII_HOVER_RAMP = "$MBNQØW@&R8GD6S9ÖOH#ÉE5UK0ÄÅA2XP34ZC%VIF17YTJL*";
const ASCII_HOVER_RAMP_LOWER = ASCII_HOVER_RAMP.toLowerCase().replace(/[0-9@&#$%()[\]{}|\\/?!;*^]/g, "");

const ASCII_INTRO_DURATION = 500;
const ASCII_INTRO_SPEED = 1;
const ASCII_ELEMENT_STAGGER = 32;

const DEFAULT_SCOPE_SELECTORS = [".name", ".panel-role", ".panel-copy", ".panel-title", ".panel-list li"];

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const lerp = (start: number, end: number, amount: number) => start * (1 - amount) + end * amount;
const easeInOutQuad = (value: number) => (value < 0.5 ? 2 * value * value : (4 - 2 * value) * value - 1);
const easeOutQuint = (value: number) => 1 + --value * value * value * value * value;

function getTextNodes(root: Element): Text[] {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (!node.parentElement) return NodeFilter.FILTER_REJECT;
      if (!/\S/.test(node.nodeValue || "")) return NodeFilter.FILTER_REJECT;
      if (node.parentElement.closest("script,style,noscript,[data-no-ascii-scramble]")) {
        return NodeFilter.FILTER_REJECT;
      }
      return NodeFilter.FILTER_ACCEPT;
    },
  });
  const nodes: Text[] = [];
  while (walker.nextNode()) nodes.push(walker.currentNode as Text);
  return nodes;
}

export function AsciiTextReveal({
  children,
  selectors,
  disabled = false,
  hover = true,
  idle = true,
}: {
  children: ReactNode;
  selectors?: string[];
  disabled?: boolean;
  hover?: boolean;
  idle?: boolean;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const hasRunRef = useRef(false);

  useEffect(() => {
    if (disabled) return;
    if (hasRunRef.current) return;
    hasRunRef.current = true;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const root = rootRef.current;
    if (!root) return;

    const scope = selectors ?? DEFAULT_SCOPE_SELECTORS;
    const elements = scope.flatMap((sel) => Array.from(root.querySelectorAll(sel)));
    const visibleElements = elements.filter((el) => (el as HTMLElement).getClientRects().length > 0);

    type CharState = { start: number; char: string; isLower: boolean; duration: number };
    const runs = new Map<Text, Record<number, CharState>>();
    const originals = new WeakMap<Text, string>();
    const timeouts: number[] = [];
    let active = false;
    let cancelled = false;

    const tick = () => {
      if (cancelled) return;
      const now = performance.now();
      runs.forEach((states, node) => {
        const chars = Array.from(node.textContent || "");
        let mutated = false;
        Object.entries(states).forEach(([key, state]) => {
          if (state.start > now) return;
          const progress = clamp((now - state.start) / state.duration, 0, 1);
          const eased = easeInOutQuad(progress);
          const ramp = state.isLower ? ASCII_REVEAL_RAMP_LOWER : ASCII_REVEAL_RAMP;
          const targetChar = state.isLower ? state.char : state.char.toUpperCase();
          const targetIndex = ramp.indexOf(targetChar);
          if (targetIndex === -1) {
            chars[Number(key)] = state.char;
            delete states[Number(key)];
            mutated = true;
            return;
          }
          const startIndex = ramp.length - 1;
          const currentIndex = Math.floor(lerp(startIndex, targetIndex, eased));
          chars[Number(key)] = ramp[Math.max(0, Math.min(currentIndex, ramp.length - 1))] || state.char;
          mutated = true;
          if (progress === 1) {
            chars[Number(key)] = state.char;
            delete states[Number(key)];
          }
        });
        if (mutated) node.textContent = chars.join("");
        if (Object.keys(states).length === 0) runs.delete(node);
      });
      if (runs.size) requestAnimationFrame(tick);
      else active = false;
    };

    const queueRevealNode = (node: Text, source: string, randomMode: boolean, totalChars: number) => {
      const original = Array.from(source);
      let delayCursor = 0;
      const states: Record<number, CharState> = {};
      original.forEach((char, index) => {
        if (/\s/.test(char)) return;
        states[index] = {
          start: performance.now() + (randomMode ? Math.random() * totalChars * ASCII_INTRO_SPEED : delayCursor),
          char,
          isLower: char === char.toLowerCase() && char !== char.toUpperCase(),
          duration: ASCII_INTRO_DURATION,
        };
        delayCursor += ASCII_INTRO_SPEED;
      });
      runs.set(node, states);
      node.textContent = original.map((char) => (/\s/.test(char) ? char : " ")).join("");
    };

    const revealElement = (element: Element) => {
      (element as HTMLElement).style.opacity = "0";
      const nodes = getTextNodes(element);
      nodes.forEach((node) => {
        if (!/\S/.test(node.textContent || "")) return;
        const source = originals.get(node) ?? node.textContent ?? "";
        originals.set(node, source);
        queueRevealNode(node, source, false, 0);
      });
      if (!active) {
        active = true;
        requestAnimationFrame(tick);
      }
      window.setTimeout(() => {
        (element as HTMLElement).style.opacity = "1";
      }, 50);
    };

    visibleElements.forEach((element, index) => {
      const tid = window.setTimeout(() => revealElement(element), index * ASCII_ELEMENT_STAGGER);
      timeouts.push(tid);
    });

    return () => {
      cancelled = true;
      timeouts.forEach((tid) => clearTimeout(tid));
      runs.forEach((_, node) => {
        const source = originals.get(node);
        if (typeof source === "string") node.textContent = source;
      });
    };
  }, [selectors, disabled]);

  useEffect(() => {
    if (disabled) return;
    if (!hover) return;
    const root = rootRef.current;
    if (!root) return;
    if (matchMedia("(hover: none)").matches) return;

    const charWidth = (() => {
      const measure = document.createElement("canvas").getContext("2d");
      if (!measure) return 8;
      const style = getComputedStyle(document.body);
      measure.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
      return measure.measureText("M").width || parseFloat(style.fontSize) * 0.68;
    })();
    const lineStep = (() => {
      const style = getComputedStyle(document.body);
      return parseFloat(style.lineHeight) || parseFloat(style.fontSize) * 1.4;
    })();

    type HoverState = { start: number; char: string; isLower: boolean; duration: number };
    const hoverRuns = new Map<Text, Record<number, HoverState>>();
    let timer: number | null = null;
    const duration = 1000;

    const queueHoverChar = (node: Text, index: number) => {
      let states = hoverRuns.get(node);
      if (!states) {
        states = {};
        hoverRuns.set(node, states);
      }
      if (index in states) return;
      const char = Array.from(node.textContent || "")[index];
      states[index] = {
        start: performance.now(),
        char,
        isLower: char === char.toLowerCase() && char !== char.toUpperCase(),
        duration,
      };
    };

    const tick = () => {
      const now = performance.now();
      hoverRuns.forEach((states, node) => {
        const chars = Array.from(node.textContent || "");
        let mutated = false;
        Object.entries(states).forEach(([key, state]) => {
          const progress = clamp((now - state.start) / state.duration, 0, 1);
          const peak = 1 - 2 * Math.abs(easeOutQuint(progress) - 0.5);
          const ramp = state.isLower ? ASCII_HOVER_RAMP_LOWER : ASCII_HOVER_RAMP;
          const targetChar = state.isLower ? state.char : state.char.toUpperCase();
          const sourceIndex = ramp.indexOf(targetChar);
          if (sourceIndex === -1) {
            chars[Number(key)] = state.char;
            delete states[Number(key)];
            mutated = true;
            return;
          }
          const edgeIndex = sourceIndex < ramp.length / 2 ? ramp.length - 1 : 0;
          const currentIndex = Math.floor(lerp(sourceIndex, edgeIndex, peak));
          chars[Number(key)] = ramp[Math.max(0, Math.min(currentIndex, ramp.length - 1))] || state.char;
          mutated = true;
          if (progress >= 0.99) {
            chars[Number(key)] = state.char;
            delete states[Number(key)];
          }
        });
        if (mutated) node.textContent = chars.join("");
        if (Object.keys(states).length === 0) hoverRuns.delete(node);
      });
      timer = hoverRuns.size ? window.setTimeout(tick, 25) : null;
    };

    const samplePoint = (clientX: number, clientY: number) => {
      const dx = 1;
      const dy = 0;
      for (let row = -dy; row <= dy; row += 1) {
        for (let col = -dx; col <= dx; col += 1) {
          const sampleX = clientX + col * charWidth;
          const sampleY = clientY + row * lineStep;
          let range: Range | null = null;
          if (document.caretPositionFromPoint) {
            const position = document.caretPositionFromPoint(sampleX, sampleY);
            if (!position) return;
            range = document.createRange();
            range.setStart(position.offsetNode, position.offset);
            range.setEnd(position.offsetNode, position.offset);
          } else if (document.caretRangeFromPoint) {
            range = document.caretRangeFromPoint(sampleX, sampleY);
          }
          if (!range) break;
          const rect = range.getClientRects()[0];
          if (!rect) break;
          const node = range.startContainer;
          const offset = range.startOffset;
          if (sampleX > rect.left + charWidth * offset) break;
          if (!node || node.nodeType !== Node.TEXT_NODE || !root.contains(node)) continue;
          const chars = Array.from(node.textContent || "");
          if (offset < 0 || offset >= chars.length) continue;
          const char = chars[offset];
          if (!char.trim()) continue;
          if (!ASCII_HOVER_RAMP.includes(char.toUpperCase()) && !ASCII_HOVER_RAMP_LOWER.includes(char)) continue;
          queueHoverChar(node as Text, offset);
        }
      }
      if (!timer && hoverRuns.size) tick();
    };

    const onMouseMove = (event: MouseEvent) => samplePoint(event.clientX, event.clientY);
    root.addEventListener("mousemove", onMouseMove);
    return () => {
      root.removeEventListener("mousemove", onMouseMove);
      if (timer) clearTimeout(timer);
    };
  }, [disabled, hover]);

  // Menu-open replay: when the .human-shell data-menu-open flips to "true",
  // scramble-in the newly-visible content inside [data-extra] panels (the
  // services/contact lists that were display:none on mobile).
  useEffect(() => {
    if (disabled) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const root = rootRef.current;
    if (!root) return;
    const shell = root.closest(".human-shell");
    if (!shell) return;

    const scope = selectors ?? DEFAULT_SCOPE_SELECTORS;
    const menuScope = scope.map((sel) => `[data-extra] ${sel}`);

    // Shared original-text map across reveal/exit cycles so an exit (which
    // scrambles text to spaces) doesn't lose the source text needed by the
    // next reveal.
    const menuOriginals = new WeakMap<Text, string>();
    const captureOriginal = (node: Text) => {
      if (menuOriginals.has(node)) return menuOriginals.get(node) as string;
      const source = node.textContent ?? "";
      menuOriginals.set(node, source);
      return source;
    };

    // Generation counter cancels any in-flight reveal/exit when a new one
    // begins, so two ticks never mutate the same text node concurrently.
    let activeGeneration = 0;

    type RevealState = { start: number; char: string; isLower: boolean; duration: number };

    const playReveal = (elements: Element[]) => {
      if (elements.length === 0) return;
      const visible = elements.filter((el) => (el as HTMLElement).getClientRects().length > 0);
      if (visible.length === 0) return;

      activeGeneration += 1;
      const generation = activeGeneration;
      const runs = new Map<Text, Record<number, RevealState>>();
      const timeouts: number[] = [];
      let active = false;

      const tick = () => {
        if (generation !== activeGeneration) return;
        const now = performance.now();
        runs.forEach((states, node) => {
          const chars = Array.from(node.textContent || "");
          let mutated = false;
          Object.entries(states).forEach(([key, state]) => {
            if (state.start > now) return;
            const progress = clamp((now - state.start) / state.duration, 0, 1);
            const eased = easeInOutQuad(progress);
            const ramp = state.isLower ? ASCII_REVEAL_RAMP_LOWER : ASCII_REVEAL_RAMP;
            const targetChar = state.isLower ? state.char : state.char.toUpperCase();
            const targetIndex = ramp.indexOf(targetChar);
            if (targetIndex === -1) {
              chars[Number(key)] = state.char;
              delete states[Number(key)];
              mutated = true;
              return;
            }
            const startIndex = ramp.length - 1;
            const currentIndex = Math.floor(lerp(startIndex, targetIndex, eased));
            chars[Number(key)] = ramp[Math.max(0, Math.min(currentIndex, ramp.length - 1))] || state.char;
            mutated = true;
            if (progress === 1) {
              chars[Number(key)] = state.char;
              delete states[Number(key)];
            }
          });
          if (mutated) node.textContent = chars.join("");
          if (Object.keys(states).length === 0) runs.delete(node);
        });
        if (runs.size) requestAnimationFrame(tick);
        else active = false;
      };

      const queueRevealNode = (node: Text, source: string) => {
        const original = Array.from(source);
        let delayCursor = 0;
        const states: Record<number, RevealState> = {};
        original.forEach((char, index) => {
          if (/\s/.test(char)) return;
          states[index] = {
            start: performance.now() + delayCursor,
            char,
            isLower: char === char.toLowerCase() && char !== char.toUpperCase(),
            duration: ASCII_INTRO_DURATION,
          };
          delayCursor += ASCII_INTRO_SPEED;
        });
        runs.set(node, states);
        node.textContent = original.map((char) => (/\s/.test(char) ? char : " ")).join("");
      };

      const revealElement = (element: Element) => {
        (element as HTMLElement).style.opacity = "0";
        const nodes = getTextNodes(element);
        nodes.forEach((node) => {
          // Source must come from the captured original — by the time the
          // first exit ran, node.textContent has been wiped to spaces.
          const source = menuOriginals.get(node) ?? node.textContent ?? "";
          if (!/\S/.test(source)) return;
          menuOriginals.set(node, source);
          queueRevealNode(node, source);
        });
        if (!active) {
          active = true;
          requestAnimationFrame(tick);
        }
        window.setTimeout(() => {
          (element as HTMLElement).style.opacity = "1";
        }, 50);
      };

      visible.forEach((element, index) => {
        const tid = window.setTimeout(() => revealElement(element), index * ASCII_ELEMENT_STAGGER);
        timeouts.push(tid);
      });
    };

    type ExitState = { start: number; char: string; isLower: boolean; duration: number };

    const playExit = (elements: Element[]) => {
      if (elements.length === 0) return;
      const visible = elements.filter((el) => (el as HTMLElement).getClientRects().length > 0);
      if (visible.length === 0) return;

      activeGeneration += 1;
      const generation = activeGeneration;
      const runs = new Map<Text, Record<number, ExitState>>();

      const tick = () => {
        if (generation !== activeGeneration) return;
        const now = performance.now();
        runs.forEach((states, node) => {
          const chars = Array.from(node.textContent || "");
          let mutated = false;
          Object.entries(states).forEach(([key, state]) => {
            if (state.start > now) return;
            const progress = clamp((now - state.start) / state.duration, 0, 1);
            const eased = easeInOutQuad(progress);
            const ramp = state.isLower ? ASCII_REVEAL_RAMP_LOWER : ASCII_REVEAL_RAMP;
            const targetChar = state.isLower ? state.char : state.char.toUpperCase();
            const sourceIndex = ramp.indexOf(targetChar);
            if (sourceIndex === -1) {
              chars[Number(key)] = progress === 1 ? " " : state.char;
              if (progress === 1) delete states[Number(key)];
              mutated = true;
              return;
            }
            // Run from the target glyph back toward the noisy end of the
            // ramp, then to space — opposite direction of reveal.
            const endIndex = ramp.length - 1;
            const currentIndex = Math.floor(lerp(sourceIndex, endIndex, eased));
            chars[Number(key)] = ramp[Math.max(0, Math.min(currentIndex, ramp.length - 1))] || " ";
            mutated = true;
            if (progress === 1) {
              chars[Number(key)] = " ";
              delete states[Number(key)];
            }
          });
          if (mutated) node.textContent = chars.join("");
          if (Object.keys(states).length === 0) runs.delete(node);
        });
        if (runs.size) requestAnimationFrame(tick);
      };

      const queueExitNode = (node: Text) => {
        // Capture the live text BEFORE we begin scrambling so the next
        // reveal can restore it. If a prior cycle already captured it,
        // prefer that (it holds the truly-original content even if the
        // current textContent is mid-animation).
        const source = captureOriginal(node);
        const original = Array.from(source);
        let delayCursor = 0;
        const states: Record<number, ExitState> = {};
        original.forEach((char, index) => {
          if (/\s/.test(char)) return;
          states[index] = {
            start: performance.now() + delayCursor,
            char,
            isLower: char === char.toLowerCase() && char !== char.toUpperCase(),
            duration: ASCII_INTRO_DURATION,
          };
          delayCursor += ASCII_INTRO_SPEED;
        });
        runs.set(node, states);
      };

      const exitElement = (element: Element) => {
        const nodes = getTextNodes(element);
        nodes.forEach((node) => {
          if (!/\S/.test(node.textContent || "")) return;
          queueExitNode(node);
        });
      };

      // Reverse order: last revealed → first to scramble out.
      const reversed = [...visible].reverse();
      reversed.forEach((element, index) => {
        window.setTimeout(() => exitElement(element), index * ASCII_ELEMENT_STAGGER);
      });
      requestAnimationFrame(tick);
    };

    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.attributeName !== "data-menu-open") continue;
        const value = (m.target as HTMLElement).dataset.menuOpen;
        // Defer one frame so the layout updates before we measure visibility.
        if (value === "true") {
          requestAnimationFrame(() => {
            const elements = menuScope.flatMap((sel) => Array.from(root.querySelectorAll(sel)));
            playReveal(elements);
          });
        } else if (value === "closing") {
          requestAnimationFrame(() => {
            const elements = menuScope.flatMap((sel) => Array.from(root.querySelectorAll(sel)));
            playExit(elements);
          });
        }
      }
    });
    observer.observe(shell, { attributes: true, attributeFilter: ["data-menu-open"] });

    return () => observer.disconnect();
  }, [disabled, selectors]);

  // Idle auto-scramble: while the user is doing nothing for IDLE_THRESHOLD,
  // periodically scramble a small number of random characters in the visible
  // scope. Pauses the moment any activity is detected.
  useEffect(() => {
    if (disabled) return;
    if (!idle) return;
    const root = rootRef.current;
    if (!root) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const IDLE_THRESHOLD = 4000; // ms of silence before idle scramble starts
    const TICK_INTERVAL = 1200; // ms between scramble picks while idle
    const CHARS_PER_TICK = 2;
    const SCRAMBLE_DURATION = 1000;

    type IdleState = { start: number; char: string; isLower: boolean; duration: number };
    const idleRuns = new Map<Text, Record<number, IdleState>>();
    let animFrame: number | null = null;
    let pickTimeout: number | null = null;
    let lastActivity = performance.now();

    const queueIdleChar = (node: Text, index: number) => {
      let states = idleRuns.get(node);
      if (!states) {
        states = {};
        idleRuns.set(node, states);
      }
      if (index in states) return;
      const char = Array.from(node.textContent || "")[index];
      states[index] = {
        start: performance.now(),
        char,
        isLower: char === char.toLowerCase() && char !== char.toUpperCase(),
        duration: SCRAMBLE_DURATION,
      };
    };

    const animate = () => {
      const now = performance.now();
      idleRuns.forEach((states, node) => {
        const chars = Array.from(node.textContent || "");
        let mutated = false;
        Object.entries(states).forEach(([key, state]) => {
          const progress = clamp((now - state.start) / state.duration, 0, 1);
          const peak = 1 - 2 * Math.abs(easeOutQuint(progress) - 0.5);
          const ramp = state.isLower ? ASCII_HOVER_RAMP_LOWER : ASCII_HOVER_RAMP;
          const targetChar = state.isLower ? state.char : state.char.toUpperCase();
          const sourceIndex = ramp.indexOf(targetChar);
          if (sourceIndex === -1) {
            chars[Number(key)] = state.char;
            delete states[Number(key)];
            mutated = true;
            return;
          }
          const edgeIndex = sourceIndex < ramp.length / 2 ? ramp.length - 1 : 0;
          const currentIndex = Math.floor(lerp(sourceIndex, edgeIndex, peak));
          chars[Number(key)] = ramp[Math.max(0, Math.min(currentIndex, ramp.length - 1))] || state.char;
          mutated = true;
          if (progress >= 0.99) {
            chars[Number(key)] = state.char;
            delete states[Number(key)];
          }
        });
        if (mutated) node.textContent = chars.join("");
        if (Object.keys(states).length === 0) idleRuns.delete(node);
      });
      animFrame = idleRuns.size ? window.setTimeout(animate, 25) : null;
    };

    const pickRandomChars = () => {
      const scope = selectors ?? DEFAULT_SCOPE_SELECTORS;
      const elements = scope.flatMap((sel) => Array.from(root.querySelectorAll(sel)));
      const visible = elements.filter((el) => (el as HTMLElement).getClientRects().length > 0);
      if (visible.length === 0) return;

      for (let i = 0; i < CHARS_PER_TICK; i += 1) {
        const element = visible[Math.floor(Math.random() * visible.length)];
        const nodes = getTextNodes(element);
        if (nodes.length === 0) continue;

        const node = nodes[Math.floor(Math.random() * nodes.length)];
        const chars = Array.from(node.textContent || "");
        // build list of eligible offsets (non-whitespace, in hover ramp)
        const eligible: number[] = [];
        for (let idx = 0; idx < chars.length; idx += 1) {
          const c = chars[idx];
          if (!c.trim()) continue;
          if (!ASCII_HOVER_RAMP.includes(c.toUpperCase()) && !ASCII_HOVER_RAMP_LOWER.includes(c)) continue;
          eligible.push(idx);
        }
        if (eligible.length === 0) continue;
        const offset = eligible[Math.floor(Math.random() * eligible.length)];
        queueIdleChar(node, offset);
      }

      if (!animFrame && idleRuns.size) animate();
    };

    const tick = () => {
      const now = performance.now();
      if (now - lastActivity >= IDLE_THRESHOLD && document.visibilityState === "visible") {
        pickRandomChars();
      }
      pickTimeout = window.setTimeout(tick, TICK_INTERVAL);
    };

    const onActivity = () => {
      lastActivity = performance.now();
    };

    window.addEventListener("mousemove", onActivity, { passive: true });
    window.addEventListener("keydown", onActivity);
    window.addEventListener("scroll", onActivity, { passive: true });
    window.addEventListener("touchstart", onActivity, { passive: true });
    document.addEventListener("visibilitychange", onActivity);

    pickTimeout = window.setTimeout(tick, TICK_INTERVAL);

    return () => {
      if (pickTimeout) clearTimeout(pickTimeout);
      if (animFrame) clearTimeout(animFrame);
      window.removeEventListener("mousemove", onActivity);
      window.removeEventListener("keydown", onActivity);
      window.removeEventListener("scroll", onActivity);
      window.removeEventListener("touchstart", onActivity);
      document.removeEventListener("visibilitychange", onActivity);
    };
  }, [disabled, idle, selectors]);

  return (
    <div ref={rootRef} className="hoverchar">
      {children}
    </div>
  );
}
