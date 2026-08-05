"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import HexMesh from "@/components/HexMesh";
import type { PageConfig, TextBlock } from "@/lib/pages";
import { SLIDE_H, SLIDE_W, stageTransform } from "@/lib/stage";
import { asset } from "@/lib/basePath";

// Arial metrikák – ezekből számoljuk vissza a tervben megadott alapvonalat
// (baseline) a CSS blokk tetejére.
const ARIAL_ASCENT = 0.9052734375;
const ARIAL_LINE = 1.14990234375;

function blockTop(b: TextBlock): number {
  const size = b.size ?? 40;
  const lh = b.lineHeight ?? 48;
  const halfLeading = (lh - size * ARIAL_LINE) / 2;
  return b.baseline - (halfLeading + size * ARIAL_ASCENT);
}

export default function SlideDeck({
  page,
  editable = false,
}: {
  page: PageConfig;
  editable?: boolean;
}) {
  const slides = Math.max(1, page.slides ?? 1);
  const last = slides - 1;

  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef(0);
  const targetRef = useRef(0);
  const dragRef = useRef<{
    id: number;
    startX: number;
    startProgress: number;
    lastX: number;
    lastT: number;
    velocity: number;
    active: boolean;
  } | null>(null);
  const [current, setCurrent] = useState(0);

  // --- rAF: a színpad követi a progress-t, és lecsillapodik a célértékre ---
  useEffect(() => {
    let raf = 0;
    let shownSlide = -1;

    function apply() {
      if (!dragRef.current?.active) {
        // Kritikusan csillapított jellegű közelítés a cél slide-hoz.
        const d = targetRef.current - progressRef.current;
        progressRef.current += Math.abs(d) < 0.0005 ? d : d * 0.18;
      }
      const t = stageTransform(
        window.innerWidth,
        window.innerHeight,
        progressRef.current
      );
      const stage = stageRef.current;
      if (stage) {
        stage.style.transform = `translate3d(${t.offX}px, ${t.offY}px, 0) scale(${t.scale})`;
      }
      const s = Math.round(progressRef.current);
      if (s !== shownSlide) {
        shownSlide = s;
        setCurrent(Math.min(last, Math.max(0, s)));
      }
      raf = requestAnimationFrame(apply);
    }

    raf = requestAnimationFrame(apply);
    return () => cancelAnimationFrame(raf);
  }, [last]);

  const goTo = useCallback(
    (i: number) => {
      targetRef.current = Math.min(last, Math.max(0, i));
    },
    [last]
  );

  // --- Húzás ---------------------------------------------------------------
  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (slides < 2) return;
      if ((e.target as HTMLElement).closest(".editor-panel, .mesh-back")) return;
      dragRef.current = {
        id: e.pointerId,
        startX: e.clientX,
        startProgress: progressRef.current,
        lastX: e.clientX,
        lastT: e.timeStamp,
        velocity: 0,
        active: false,
      };
    },
    [slides]
  );

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const d = dragRef.current;
    if (!d || d.id !== e.pointerId) return;
    const dx = e.clientX - d.startX;
    if (!d.active) {
      if (Math.abs(dx) < 8) return; // koppintás, nem húzás
      d.active = true;
      d.startX = e.clientX; // ne ugorjon a küszöbnyit
      rootRef.current?.setPointerCapture?.(e.pointerId);
    }
    const t = stageTransform(window.innerWidth, window.innerHeight, 0);
    const raw = d.startProgress - (e.clientX - d.startX) / t.slideW;
    // Gumiszalag a két szélén.
    const clamped =
      raw < 0 ? raw * 0.35 : raw > last ? last + (raw - last) * 0.35 : raw;
    progressRef.current = clamped;

    const dt = e.timeStamp - d.lastT;
    if (dt > 0) {
      const v = -((e.clientX - d.lastX) / t.slideW / dt) * 1000; // slide/mp
      d.velocity = d.velocity * 0.7 + v * 0.3;
      d.lastX = e.clientX;
      d.lastT = e.timeStamp;
    }
  }, [last]);

  const endDrag = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const d = dragRef.current;
      if (!d || d.id !== e.pointerId) return;
      dragRef.current = null;
      if (!d.active) return;
      rootRef.current?.releasePointerCapture?.(e.pointerId);
      // Lendületből átlapoz, egyébként a legközelebbi slide-ra ugrik.
      const from = Math.round(d.startProgress);
      let next = Math.round(progressRef.current);
      if (Math.abs(d.velocity) > 0.6) {
        next = d.velocity > 0 ? from + 1 : from - 1;
      }
      goTo(next);
    },
    [goTo]
  );

  // --- Billentyűzet / görgő ------------------------------------------------
  useEffect(() => {
    if (slides < 2) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight") goTo(Math.round(targetRef.current) + 1);
      else if (e.key === "ArrowLeft") goTo(Math.round(targetRef.current) - 1);
      else return;
      e.preventDefault();
    }
    let wheelLock = 0;
    function onWheel(e: WheelEvent) {
      const dx = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      if (Math.abs(dx) < 12) return;
      const now = e.timeStamp;
      if (now - wheelLock < 350) return;
      wheelLock = now;
      goTo(Math.round(targetRef.current) + (dx > 0 ? 1 : -1));
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("wheel", onWheel, { passive: true });
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("wheel", onWheel);
    };
  }, [slides, goTo]);

  return (
    <div
      ref={rootRef}
      className="mesh-page"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    >
      <HexMesh page={page} editable={editable} progressRef={progressRef} />

      {/* A canvas fölötti, vele azonos transzformációjú réteg: a felirat és a
          slide-okhoz kötött szövegek. Ugyanaz a stageTransform mozgatja, mint
          a képet és a rácsot – ezért mozognak egyben. */}
      <div
        ref={stageRef}
        className="mesh-stage"
        style={{ width: SLIDE_W * slides, height: SLIDE_H }}
        aria-hidden={false}
      >
        {page.titleParts?.map((t) => (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            key={t.src}
            className="stage-title"
            src={asset(t.src)}
            alt=""
            aria-hidden
            style={{ left: t.x, top: t.y, width: t.w, height: t.h }}
          />
        ))}

        {page.texts?.map((b, i) => (
          <div
            key={i}
            className="stage-text"
            style={{
              left: b.slide * SLIDE_W + b.x,
              top: blockTop(b),
              fontSize: b.size ?? 40,
              color: b.color ?? "#ffffff",
            }}
          >
            {b.lines.map((line, j) => (
              <div
                key={j}
                style={{ height: b.lineHeight ?? 48, lineHeight: `${b.lineHeight ?? 48}px` }}
              >
                {line || " "}
              </div>
            ))}
          </div>
        ))}
      </div>

      {slides > 1 && (
        <div className="slide-dots" role="tablist" aria-label="Slide-ok">
          {Array.from({ length: slides }, (_, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={i === current}
              aria-label={`${i + 1}. slide`}
              className={i === current ? "active" : ""}
              onClick={() => goTo(i)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
