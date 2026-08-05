"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { buildMesh, vertexAt, type Mesh } from "@/lib/hexMesh";
import type { OverlayRect, PageConfig } from "@/lib/pages";
import {
  BLEED_Y,
  SLIDE_H,
  SLIDE_W,
  stageTransform,
  type StageTransform,
} from "@/lib/stage";

type PenColor = "black" | "white" | "none";

function stroke(alpha: number, color: PenColor): string | null {
  if (color === "none" || alpha <= 0) return null;
  const rgb = color === "white" ? "255,255,255" : "0,0,0";
  return `rgba(${rgb},${alpha.toFixed(3)})`;
}

const COLOR_OPTIONS: { v: PenColor; label: string }[] = [
  { v: "black", label: "Fekete" },
  { v: "white", label: "Fehér" },
  { v: "none", label: "Átlátszó" },
];

function ColorPicker({
  value,
  onChange,
}: {
  value: PenColor;
  onChange: (c: PenColor) => void;
}) {
  return (
    <div className="editor-colors">
      {COLOR_OPTIONS.map((o) => (
        <button
          key={o.v}
          type="button"
          className={o.v === value ? "active" : ""}
          onClick={() => onChange(o.v)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function pointInPolygon(pts: { x: number; y: number }[], x: number, y: number) {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const xi = pts[i].x,
      yi = pts[i].y,
      xj = pts[j].x,
      yj = pts[j].y;
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

/**
 * A maszk kitöltése. Ha vannak eltérő színű területek, azokból egy
 * offscreen canvas-alapú mintát készítünk, így egyetlen evenodd fill-lel
 * megy ki az egész (a kilyukasztott hatszögek helye marad átlátszó).
 */
const PAD = BLEED_Y + 200;
function buildOverlayFill(
  ctx: CanvasRenderingContext2D,
  base: string,
  rects: OverlayRect[] | undefined,
  w: number,
  h: number
): string | CanvasPattern {
  if (!rects || rects.length === 0) return base;
  try {
    const s = 0.5;
    const off = document.createElement("canvas");
    off.width = Math.round((w + 2 * PAD) * s);
    off.height = Math.round((h + 2 * PAD) * s);
    const octx = off.getContext("2d");
    if (!octx) return base;
    octx.fillStyle = base;
    octx.fillRect(0, 0, off.width, off.height);
    for (const r of rects) {
      // A vászon szélét érintő területek túlfutnak, hogy a 9:16-nál nyúltabb
      // képernyőkön se maradjon üres sáv fent/lent.
      const top = r.y <= 0 ? -PAD : r.y;
      const bottom = r.y + r.h >= h ? h + PAD : r.y + r.h;
      octx.fillStyle = r.color;
      octx.fillRect((r.x + PAD) * s, (top + PAD) * s, r.w * s, (bottom - top) * s);
    }
    const pat = ctx.createPattern(off, "no-repeat");
    if (!pat || typeof pat.setTransform !== "function") return base;
    pat.setTransform(new DOMMatrix().translateSelf(-PAD, -PAD).scaleSelf(1 / s));
    return pat;
  } catch {
    return base;
  }
}

export default function HexMesh({
  page,
  editable = false,
  progressRef,
}: {
  page: PageConfig;
  editable?: boolean;
  /** A swipe pozíciója (törtszám slide-ban). Ha nincs, a vászon áll. */
  progressRef?: React.RefObject<number>;
}) {
  const slides = Math.max(1, page.slides ?? 1);
  const DESIGN_W = SLIDE_W * slides;
  const DESIGN_H = SLIDE_H;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const meshRef = useRef<Mesh | null>(null);
  const transformRef = useRef<StageTransform>({
    scale: 1,
    offX: 0,
    offY: 0,
    slideW: SLIDE_W,
  });
  const selectedRef = useRef<Set<number>>(new Set());
  const [selected, setSelected] = useState<number[]>([]);
  const [copied, setCopied] = useState(false);

  // Élőben állítható paraméterek (a szerkesztő csúszkái ezeket mozgatják).
  const hexRadiusRef = useRef(page.hexRadius ?? 96);
  const rebuildRef = useRef<() => void>(() => {});
  const [hexRadius, setHexRadius] = useState(page.hexRadius ?? 96);
  const spikeCountRef = useRef(page.spikes?.count ?? 0);
  const spikeWidthRef = useRef(page.spikes?.width ?? 0.12);
  const [spikeCount, setSpikeCount] = useState(page.spikes?.count ?? 0);
  const [spikeWidth, setSpikeWidth] = useState(page.spikes?.width ?? 0.12);
  const lineOpacityRef = useRef(page.lineOpacity ?? 0.42);
  const lineColorRef = useRef<PenColor>(page.lineColor ?? "white");
  const borderOpacityRef = useRef(page.borderOpacity ?? 0.85);
  const borderColorRef = useRef<PenColor>(page.borderColor ?? "white");
  const speedRef = useRef(page.speed ?? 1);
  const [lineOpacity, setLineOpacity] = useState(page.lineOpacity ?? 0.42);
  const [lineColor, setLineColor] = useState<PenColor>(
    page.lineColor ?? "white"
  );
  const [borderOpacity, setBorderOpacity] = useState(page.borderOpacity ?? 0.85);
  const [borderColor, setBorderColor] = useState<PenColor>(
    page.borderColor ?? "white"
  );
  const [speed, setSpeed] = useState(page.speed ?? 1);

  // A kiválasztott halmazt tükrözzük egy ref-be, hogy a rajzoló ciklus
  // mindig a friss értéket lássa (ne ragadjon be a closure-ba).
  useEffect(() => {
    selectedRef.current = new Set(selected);
  }, [selected]);

  useEffect(() => {
    hexRadiusRef.current = hexRadius;
    spikeCountRef.current = spikeCount;
    spikeWidthRef.current = spikeWidth;
    rebuildRef.current();
  }, [hexRadius, spikeCount, spikeWidth]);

  useEffect(() => {
    lineOpacityRef.current = lineOpacity;
  }, [lineOpacity]);

  useEffect(() => {
    lineColorRef.current = lineColor;
  }, [lineColor]);

  useEffect(() => {
    borderOpacityRef.current = borderOpacity;
  }, [borderOpacity]);

  useEffect(() => {
    borderColorRef.current = borderColor;
  }, [borderColor]);

  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const overlayFill = buildOverlayFill(
      ctx,
      page.overlay ?? "#0b0b0b",
      page.overlayRects,
      DESIGN_W,
      DESIGN_H
    );

    // A hálót fix tervezési méretben építjük; a csempeméret (R) állításakor
    // újraépítjük, de a rAF ciklus fut tovább (nem akad meg az animáció).
    function buildAt() {
      const R = hexRadiusRef.current;
      const mesh = buildMesh({
        width: DESIGN_W,
        height: DESIGN_H,
        R,
        seed: page.seed ?? 1,
        jitter: page.jitter,
        reveal: page.reveal,
        spikes: {
          ...page.spikes,
          count: spikeCountRef.current,
          width: spikeWidthRef.current,
        },
        // A rács is túlfut, hogy a függőleges ráhagyást kitöltse.
        pad: Math.max(R * 1.5, BLEED_Y + R),
      });
      meshRef.current = mesh;
      // A feltárt (átlátszó) hatszögeket MINDIG betöltjük – a rajzoló ciklus
      // ebből dolgozik nézet módban is. Új R -> új rács -> a kijelölés a
      // feltárási alapértékre áll vissza.
      const initial = mesh.hexes.filter((h) => h.revealed).map((h) => h.index);
      selectedRef.current = new Set(initial);
      if (editable) setSelected([...initial].sort((a, b) => a - b));
    }
    rebuildRef.current = buildAt;
    buildAt();

    let raf = 0;
    let startTs = 0;
    let cssW = 0;
    let cssH = 0;
    let dpr = 1;

    const img = new Image();
    let imgReady = false;
    img.onload = () => (imgReady = true);
    img.src = page.image;

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      cssW = window.innerWidth;
      cssH = window.innerHeight;
      canvas!.width = Math.round(cssW * dpr);
      canvas!.height = Math.round(cssH * dpr);
      canvas!.style.width = cssW + "px";
      canvas!.style.height = cssH + "px";
    }

    function drawImageCover() {
      // A kép a TELJES vásznat fedi (nem slide-onként) – így swipe közben
      // a kép és a rács egyetlen, összefüggő képként vándorol. Függőlegesen
      // túlfut, hogy a nyúltabb telefonokon se legyen üres sáv.
      const boxH = DESIGN_H + 2 * BLEED_Y;
      if (!imgReady || !img.width || !img.height) {
        ctx!.fillStyle = "#1a1a1a";
        ctx!.fillRect(0, -BLEED_Y, DESIGN_W, boxH);
        return;
      }
      const s = Math.max(DESIGN_W / img.width, boxH / img.height);
      const w = img.width * s;
      const h = img.height * s;
      // Fekete-fehér maszk a képen: szürkeárnyalat + kis kontraszt.
      ctx!.filter = "grayscale(1) contrast(1.08)";
      ctx!.drawImage(img, (DESIGN_W - w) / 2, (DESIGN_H - h) / 2, w, h);
      ctx!.filter = "none";
    }

    function polygonPath(m: Mesh, ids: number[], tSec: number) {
      const first = vertexAt(m, ids[0], tSec);
      ctx!.moveTo(first.x, first.y);
      for (let i = 1; i < ids.length; i++) {
        const v = vertexAt(m, ids[i], tSec);
        ctx!.lineTo(v.x, v.y);
      }
      ctx!.closePath();
    }

    function frame(ts: number) {
      const m = meshRef.current;
      if (!m) {
        raf = requestAnimationFrame(frame);
        return;
      }
      if (!startTs) startTs = ts;
      // A mozgás sebességét a csúszka (speedRef) szabja meg; 0 = álló háló.
      const tSec = ((ts - startTs) / 1000) * speedRef.current;
      const sel = selectedRef.current;
      const gridStroke = stroke(lineOpacityRef.current, lineColorRef.current);
      const borderStroke = stroke(
        borderOpacityRef.current,
        borderColorRef.current
      );

      // A swipe pozíciója szerinti eltolás – ugyanaz a képlet, mint a DOM
      // rétegeknél (SlideDeck), így a felirat és a szövegek együtt mozognak
      // a képpel és a ráccsal.
      const t = stageTransform(cssW, cssH, progressRef?.current ?? 0);
      transformRef.current = t;

      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx!.clearRect(0, 0, cssW, cssH);
      ctx!.setTransform(
        dpr * t.scale,
        0,
        0,
        dpr * t.scale,
        dpr * t.offX,
        dpr * t.offY
      );

      // 1) Fekete-fehér háttérkép.
      drawImageCover();

      // 2) Maszk: minden kitöltve az overlay színnel, kivéve az átlátszó
      //    hatszögeket (even-odd "kilyukasztás").
      ctx!.beginPath();
      ctx!.rect(-PAD, -PAD, DESIGN_W + 2 * PAD, DESIGN_H + 2 * PAD);
      for (const h of m.hexes) {
        if (sel.has(h.index)) polygonPath(m, h.vertexIds, tSec);
      }
      ctx!.fillStyle = overlayFill;
      ctx!.fill("evenodd");

      // 3) A háló élei – választott szín + átlátszatlanság.
      ctx!.lineJoin = "round";
      if (gridStroke) {
        ctx!.lineWidth = 1.3;
        ctx!.strokeStyle = gridStroke;
        ctx!.beginPath();
        for (const h of m.hexes) polygonPath(m, h.vertexIds, tSec);
        ctx!.stroke();
      }

      // 4) Az átlátszó ablakok kerete – külön szín + átlátszatlanság.
      if (borderStroke) {
        ctx!.lineWidth = 2;
        ctx!.strokeStyle = borderStroke;
        ctx!.beginPath();
        for (const h of m.hexes) {
          if (sel.has(h.index)) polygonPath(m, h.vertexIds, tSec);
        }
        ctx!.stroke();
      }

      raf = requestAnimationFrame(frame);
    }

    resize();
    raf = requestAnimationFrame(frame);
    window.addEventListener("resize", resize);
    window.addEventListener("orientationchange", resize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("orientationchange", resize);
      meshRef.current = null;
    };
  }, [page, editable, progressRef, DESIGN_W, DESIGN_H]);

  // --- Szerkesztő: koppintás egy hatszögre -> ki/be kapcsolás -------------
  // Csak akkor kapcsolunk, ha a mutató nem mozdult el – így a lapozó
  // húzás nem jelöl ki véletlenül hatszögeket.
  const tapStartRef = useRef<{ x: number; y: number } | null>(null);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      tapStartRef.current = { x: e.clientX, y: e.clientY };
    },
    []
  );

  const handlePointer = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!editable) return;
      const start = tapStartRef.current;
      tapStartRef.current = null;
      if (!start) return;
      if (Math.hypot(e.clientX - start.x, e.clientY - start.y) > 6) return;
      const m = meshRef.current;
      if (!m) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      const t = transformRef.current;
      const dx = (sx - t.offX) / t.scale;
      const dy = (sy - t.offY) / t.scale;

      for (const h of m.hexes) {
        const pts = h.vertexIds.map((id) => m.base[id]);
        if (pointInPolygon(pts, dx, dy)) {
          const next = new Set(selectedRef.current);
          if (next.has(h.index)) next.delete(h.index);
          else next.add(h.index);
          setSelected([...next].sort((a, b) => a - b));
          setCopied(false);
          break;
        }
      }
    },
    [editable]
  );

  const copyIndices = useCallback(() => {
    const text =
      `hexRadius: ${hexRadius},\n` +
      `spikes: { count: ${spikeCount}, width: ${spikeWidth} },\n` +
      `reveal: { indices: [${selected.join(", ")}] },\n` +
      `lineOpacity: ${lineOpacity}, lineColor: "${lineColor}",\n` +
      `borderOpacity: ${borderOpacity}, borderColor: "${borderColor}",\n` +
      `speed: ${Number(speed.toFixed(2))},`;
    navigator.clipboard?.writeText(text).then(
      () => setCopied(true),
      () => setCopied(false)
    );
  }, [
    hexRadius,
    spikeCount,
    spikeWidth,
    selected,
    lineOpacity,
    lineColor,
    borderOpacity,
    borderColor,
    speed,
  ]);

  return (
    <>
      <canvas
        ref={canvasRef}
        className="hexmesh"
        onPointerDown={editable ? handlePointerDown : undefined}
        onPointerUp={editable ? handlePointer : undefined}
        style={{ touchAction: editable ? "none" : undefined }}
      />
      {editable && (
        <div className="editor-panel">
          <div className="editor-count">{selected.length} hatszög kijelölve</div>

          <label className="editor-slider">
            <span>
              Csempeméret
              <b>{hexRadius}px</b>
            </span>
            <input
              type="range"
              min={60}
              max={280}
              step={2}
              value={hexRadius}
              onChange={(e) => {
                setHexRadius(Number(e.target.value));
                setCopied(false);
              }}
            />
          </label>

          <div className="editor-group">
            <label className="editor-slider">
              <span>
                Tűk (hegyesszögű háromszögek)
                <b>{spikeCount} db</b>
              </span>
              <input
                type="range"
                min={0}
                max={12}
                step={1}
                value={spikeCount}
                onChange={(e) => {
                  setSpikeCount(Number(e.target.value));
                  setCopied(false);
                }}
              />
            </label>
            <label className="editor-slider">
              <span>
                Tű rövid oldala
                <b>{spikeWidth.toFixed(3)}</b>
              </span>
              <input
                type="range"
                min={0.03}
                max={0.35}
                step={0.005}
                value={spikeWidth}
                onChange={(e) => {
                  setSpikeWidth(Number(e.target.value));
                  setCopied(false);
                }}
              />
            </label>
          </div>

          <div className="editor-group">
            <label className="editor-slider">
              <span>
                Rácsvonalak átlátszatlansága
                <b>{Math.round(lineOpacity * 100)}%</b>
              </span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.02}
                value={lineOpacity}
                onChange={(e) => {
                  setLineOpacity(Number(e.target.value));
                  setCopied(false);
                }}
              />
            </label>
            <ColorPicker
              value={lineColor}
              onChange={(c) => {
                setLineColor(c);
                setCopied(false);
              }}
            />
          </div>

          <div className="editor-group">
            <label className="editor-slider">
              <span>
                Kijelölt keret átlátszatlansága
                <b>{Math.round(borderOpacity * 100)}%</b>
              </span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.02}
                value={borderOpacity}
                onChange={(e) => {
                  setBorderOpacity(Number(e.target.value));
                  setCopied(false);
                }}
              />
            </label>
            <ColorPicker
              value={borderColor}
              onChange={(c) => {
                setBorderColor(c);
                setCopied(false);
              }}
            />
          </div>

          <label className="editor-slider">
            <span>
              Pontok mozgási sebessége
              <b>{speed.toFixed(2)}×</b>
            </span>
            <input
              type="range"
              min={0}
              max={3}
              step={0.05}
              value={speed}
              onChange={(e) => {
                setSpeed(Number(e.target.value));
                setCopied(false);
              }}
            />
          </label>

          <code className="editor-code">
            hexRadius: {hexRadius},
            {"\n"}spikes: {"{"} count: {spikeCount}, width: {spikeWidth}{" "}
            {"}"},
            {"\n"}reveal: {"{"} indices: [{selected.join(", ")}] {"}"},
            {"\n"}lineOpacity: {lineOpacity}, lineColor: &quot;{lineColor}&quot;,
            {"\n"}borderOpacity: {borderOpacity}, borderColor: &quot;
            {borderColor}&quot;,
            {"\n"}speed: {Number(speed.toFixed(2))},
          </code>
          <button className="editor-copy" onClick={copyIndices}>
            {copied ? "✓ Kimásolva" : "Másolás a configba"}
          </button>
        </div>
      )}
    </>
  );
}
