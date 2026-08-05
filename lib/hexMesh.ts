// Osztott csúcsú (shared-vertex) hatszög-méhsejt térháló.
// A szomszédos hatszögek ugyanazokat a csúcsokat használják, így amikor a
// csúcsok finoman elmozdulnak, a háló összefüggő marad (nem szakad szét).

export type Vec = { x: number; y: number };

export type Hex = {
  index: number;
  cx: number;
  cy: number;
  vertexIds: number[]; // 6 index a `vertices` tömbbe
  revealed: boolean; // igaz = átlátszó ablak, átlátszik a kép
};

export type VertexAnim = {
  ax: number; // amplitúdó X (px)
  ay: number; // amplitúdó Y (px)
  px: number; // fázis X
  py: number; // fázis Y
  sx: number; // sebesség X
  sy: number; // sebesség Y
};

export type Mesh = {
  base: Vec[]; // nyugalmi (szabálytalanná torzított) csúcspozíciók
  anim: VertexAnim[]; // csúcsonkénti animációs paraméterek
  hexes: Hex[];
  width: number;
  height: number;
  R: number;
};

export type RevealSpec = {
  // Ha meg van adva, pontosan ezek a hatszög-indexek lesznek átlátszóak.
  indices?: number[];
  // Kézzel elhelyezett feltárási foltok a vászon koordinátáiban – így a kép
  // ott bukkan elő, ahol a terv szerint kell (és nem a szövegek alatt).
  spots?: { x: number; y: number; r: number }[];
  // Egyébként "foltokban" nyílik ki a háló, hogy összefüggő képrészletek
  // látsszanak. A klaszterek száma és mérete a seed-ből determinisztikus.
  clusters?: number;
};

// --- Determinisztikus véletlen (mulberry32) ----------------------------------

export function makeRng(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// --- Térháló építése ---------------------------------------------------------

export function buildMesh(opts: {
  width: number;
  height: number;
  R: number; // hatszög sugara (közép -> csúcs)
  seed: number;
  jitter?: number; // szabálytalanság mértéke (a R hányada), 0..0.4
  reveal?: RevealSpec;
  /** Mennyivel lógjon túl a rács a vászon szélein (px). Alap: 1.5·R. */
  pad?: number;
}): Mesh {
  const { width, height, R, seed } = opts;
  const jitter = opts.jitter ?? 0.26;
  const rng = makeRng(seed);

  // Hegyes-tetejű (pointy-top) elrendezés.
  const hStep = Math.sqrt(3) * R; // vízszintes középtávolság
  const vStep = 1.5 * R; // függőleges sortávolság
  const pad = opts.pad ?? R * 1.5; // lógjunk túl a szélen, hogy ne legyen üres perem

  const vertexMap = new Map<string, number>();
  const base: Vec[] = [];

  function vertexId(x: number, y: number): number {
    // Kerekítéssel dedupláljuk az egybeeső csúcsokat -> osztott csúcsok.
    const key = `${Math.round(x)}:${Math.round(y)}`;
    let id = vertexMap.get(key);
    if (id === undefined) {
      id = base.length;
      vertexMap.set(key, id);
      base.push({ x, y });
    }
    return id;
  }

  const hexes: Hex[] = [];
  const rows = Math.ceil((height + 2 * pad) / vStep) + 1;
  const cols = Math.ceil((width + 2 * pad) / hStep) + 1;

  for (let row = 0; row < rows; row++) {
    const y = -pad + row * vStep;
    const xOffset = row % 2 === 0 ? 0 : hStep / 2;
    for (let col = 0; col < cols; col++) {
      const cx = -pad + xOffset + col * hStep;
      const cy = y;
      const vertexIds: number[] = [];
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI / 180) * (60 * i - 90); // hegyes-tető
        vertexIds.push(vertexId(cx + R * Math.cos(a), cy + R * Math.sin(a)));
      }
      hexes.push({ index: hexes.length, cx, cy, vertexIds, revealed: false });
    }
  }

  // Szabálytalanítás: minden EGYEDI csúcsot elmozdítunk egy kicsit.
  // Mivel osztott, a szomszédos hatszögek együtt mozdulnak -> nincs rés.
  const jAmp = jitter * R;
  for (const v of base) {
    const ang = rng() * Math.PI * 2;
    const mag = rng() * jAmp;
    v.x += Math.cos(ang) * mag;
    v.y += Math.sin(ang) * mag;
  }

  // Csúcsonkénti animációs paraméterek. Az amplitúdó a hatszög méretéhez
  // skálázódik, így nagyobb csempéknél látványosabb a hullámzás.
  const amp = () => (0.07 + rng() * 0.11) * R;
  const anim: VertexAnim[] = base.map(() => ({
    ax: amp(),
    ay: amp(),
    px: rng() * Math.PI * 2,
    py: rng() * Math.PI * 2,
    sx: 0.5 + rng() * 0.7,
    sy: 0.5 + rng() * 0.7,
  }));

  // Melyik hatszög legyen átlátszó?
  applyReveal(hexes, { width, height, R }, opts.reveal ?? {}, seed);

  return { base, anim, hexes, width, height, R };
}

function applyReveal(
  hexes: Hex[],
  dim: { width: number; height: number; R: number },
  spec: RevealSpec,
  seed: number
) {
  if (spec.indices && spec.indices.length) {
    const set = new Set(spec.indices);
    for (const h of hexes) h.revealed = set.has(h.index);
    return;
  }

  // Foltos feltárás: néhány központ köré nyitunk ablakokat, így összefüggő
  // képrészletek bukkannak elő a szabályos "szórás" helyett.
  const rng = makeRng(seed ^ 0x9e3779b9);
  let centers: { x: number; y: number; r: number }[] = [];
  if (spec.spots && spec.spots.length) {
    centers = spec.spots;
  } else {
    const nClusters = spec.clusters ?? 3 + Math.floor(rng() * 3);
    const minDim = Math.min(dim.width, dim.height);
    for (let i = 0; i < nClusters; i++) {
      centers.push({
        x: dim.width * (0.15 + rng() * 0.7),
        y: dim.height * (0.15 + rng() * 0.7),
        r: minDim * (0.12 + rng() * 0.16),
      });
    }
  }
  for (const h of hexes) {
    for (const c of centers) {
      const dx = h.cx - c.x;
      const dy = h.cy - c.y;
      if (dx * dx + dy * dy <= c.r * c.r) {
        h.revealed = true;
        break;
      }
    }
  }
}

// --- Aktuális csúcspozíció adott időpillanatban ------------------------------

export function vertexAt(mesh: Mesh, id: number, tSec: number): Vec {
  const b = mesh.base[id];
  const a = mesh.anim[id];
  return {
    x: b.x + Math.sin(tSec * a.sx + a.px) * a.ax,
    y: b.y + Math.cos(tSec * a.sy + a.py) * a.ay,
  };
}
