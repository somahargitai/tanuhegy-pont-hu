// Osztott csúcsú (shared-vertex) hatszög-méhsejt térháló.
// A szomszédos hatszögek ugyanazokat a csúcsokat használják, így amikor a
// csúcsok finoman elmozdulnak, a háló összefüggő marad (nem szakad szét).

export type Vec = { x: number; y: number };

export type Hex = {
  index: number;
  cx: number;
  cy: number;
  /** Rendszerint 6 index a `base` tömbbe – tüske mellett 7 (hétszög) vagy 3
   *  (a kiszakadó vékony háromszög). */
  vertexIds: number[];
  revealed: boolean; // igaz = átlátszó ablak, átlátszik a kép
  /** Igaz, ha ez a lap egy tüske háromszöge. */
  spike?: boolean;
};

/**
 * "Tüske" csúcs: nem önálló pont, hanem két másik csúcsból származtatott.
 * Az `a`–`b` élen `t` arányban ül, onnan `off` (az él hosszának hányada)
 * merőleges kitéréssel. Így a háló mozgásakor együtt hullámzik a szomszédjaival.
 */
export type SpikeVertex = {
  a: number;
  b: number;
  t: number;
  off: number;
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
  /** Csúcsonként: ha nem null, származtatott ("tüske") csúcs. */
  spike: (SpikeVertex | null)[];
  hexes: Hex[];
  width: number;
  height: number;
  R: number;
};

/**
 * Vékony, hosszú, HEGYESSZÖGŰ háromszögek ("tűk") beszúrása.
 *
 * A módszer: kiválasztunk egy meglévő rácspontot (lehetőleg egy hatszög ALSÓ
 * csúcsát), és lecseréljük egy rá szimmetrikus, rövid szakaszra – az eredeti
 * pont a szakasz felezőpontja. Ez a szakasz lesz a háromszög rövid oldala, a
 * csúcsa pedig a szomszédos (közel függőlegesen lefelé menő) rácspont.
 *
 * Az eredeti pontot egyik lap sem használja többé:
 *   – a szakaszra merőleges él két oldalán lévő két lap egy-egy végpontot kap
 *     (mindkettő hatszög marad, csak a sarka odébb csúszik),
 *   – a harmadik, szemközti lap MINDKÉT végpontot megkapja → hétszög lesz,
 *   – a kettő közé beszorul a tű: rövid alap + két hosszú oldal.
 *
 * Így mindhárom szög hegyes (a hosszú oldalak közel egyenlőek), szemben a
 * "pont az él mentén" megoldással, ami mindig tompaszöget adott.
 */
export type SpikeSpec = {
  /** Hány tű keletkezzen az egész vásznon. Alap: 0 (nincs tű). */
  count?: number;
  /** A rövid oldal hossza az él hosszához képest. Alap: 0.12. */
  width?: number;
  /** Mennyire lehet ferde a tű: 1 = csak tökéletesen függőleges. Alap: 0.86. */
  minVertical?: number;
  /** Két tű legkisebb távolsága px-ben, hogy szét legyenek szórva. Alap: 700. */
  minDistance?: number;
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
  spikes?: SpikeSpec;
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

  const spike: (SpikeVertex | null)[] = base.map(() => null);
  addSpikes({ base, anim, spike, hexes }, opts.spikes ?? {}, seed);

  // A tüskék után jönnek létre az új lapok, ezért a pontos index-listát
  // (szerkesztőből másolt `indices`) itt kell újra alkalmazni.
  if (opts.reveal?.indices?.length) {
    applyReveal(hexes, { width, height, R }, opts.reveal, seed);
  }

  return { base, anim, spike, hexes, width, height, R };
}

/**
 * Tűk beszúrása – lásd a SpikeSpec leírását.
 *
 * A kiválasztott rácspontot (V) lecseréljük egy rá szimmetrikus, rövid
 * szakaszra (V1–V2), ami merőleges a V-ből lefelé induló élre (V→N).
 * A V–N él két oldalán lévő lap egy-egy végpontot kap, a szemközti lap
 * mindkettőt (→ hétszög), a maradék rés pedig a tű: V1–V2–N.
 */
function addSpikes(
  m: {
    base: Vec[];
    anim: VertexAnim[];
    spike: (SpikeVertex | null)[];
    hexes: Hex[];
  },
  spec: SpikeSpec,
  seed: number
) {
  const count = spec.count ?? 0;
  if (count <= 0) return;
  const width = spec.width ?? 0.12;
  const minVertical = spec.minVertical ?? 0.93;
  const minDistance = spec.minDistance ?? 700;
  const rng = makeRng(seed ^ 0x517cc1b7);

  // Melyik lapok érintik az egyes csúcsokat.
  const facesAt = new Map<number, number[]>();
  for (const h of m.hexes) {
    for (const id of h.vertexIds) {
      const arr = facesAt.get(id);
      if (arr) arr.push(h.index);
      else facesAt.set(id, [h.index]);
    }
  }

  type Cand = { v: number; n: number; ab: number[]; c: number; y: number };
  const cands: Cand[] = [];

  for (const [vid, faces] of facesAt) {
    if (faces.length !== 3) continue; // csak belső csúcs (a peremen nincs 3 lap)
    const V = m.base[vid];

    // A csúcs szomszédai a lapok gyűrűiből.
    const nb = new Set<number>();
    for (const fi of faces) {
      const ring = m.hexes[fi].vertexIds;
      const k = ring.indexOf(vid);
      nb.add(ring[(k + 1) % ring.length]);
      nb.add(ring[(k - 1 + ring.length) % ring.length]);
    }

    // A LEFELÉ menő, leginkább függőleges él – így lesz a tű közel függőleges,
    // és a hozzá tartozó V egy hatszög alsó csúcsa.
    let n = -1;
    let vertical = 0;
    for (const nid of nb) {
      const N = m.base[nid];
      const dy = N.y - V.y;
      if (dy <= 0) continue;
      const s = dy / Math.hypot(N.x - V.x, dy);
      if (s > vertical) {
        vertical = s;
        n = nid;
      }
    }
    if (n < 0 || vertical < minVertical) continue;

    // A V–N él két oldalán lévő lapok, és a szemközti harmadik.
    const ab = faces.filter((fi) => m.hexes[fi].vertexIds.includes(n));
    if (ab.length !== 2) continue;
    const c = faces.find((fi) => !ab.includes(fi));
    if (c === undefined) continue;

    // Csak ott, ahol a tű látszik is: a rés a két oldalsó lap KÖZÖTT fut,
    // ezért mindkettőnek feltártnak (képnek) kell lennie – így rajzolódik
    // ki sötét tűként.
    if (!m.hexes[ab[0]].revealed || !m.hexes[ab[1]].revealed) continue;

    cands.push({ v: vid, n, ab, c, y: V.y });
  }

  if (cands.length === 0) return;

  // Determinisztikus keverés, majd egymástól távoli jelöltek kiválasztása.
  for (let i = cands.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [cands[i], cands[j]] = [cands[j], cands[i]];
  }

  const chosen: Cand[] = [];
  const usedFaces = new Set<number>();
  for (const cd of cands) {
    if (chosen.length >= count) break;
    if (usedFaces.has(cd.ab[0]) || usedFaces.has(cd.ab[1]) || usedFaces.has(cd.c))
      continue;
    const V = m.base[cd.v];
    if (
      chosen.some((o) => {
        const P = m.base[o.v];
        return Math.hypot(P.x - V.x, P.y - V.y) < minDistance;
      })
    )
      continue;
    chosen.push(cd);
    usedFaces.add(cd.ab[0]);
    usedFaces.add(cd.ab[1]);
    usedFaces.add(cd.c);
  }

  const half = width / 2;

  for (const cd of chosen) {
    const V = m.base[cd.v];
    const N = m.base[cd.n];
    const dx = N.x - V.x;
    const dy = N.y - V.y;
    const len = Math.hypot(dx, dy);
    if (len < 1) continue;
    // Az élre merőleges irány – ezen fekszik a rövid szakasz.
    const ux = -dy / len;
    const uy = dx / len;

    // A két új csúcs: az eredeti pont a felezőpontjuk. Származtatottak, ezért
    // a háló mozgásakor együtt vándorolnak V-vel és N-nel (a tű alakja marad).
    const id1 = m.base.length;
    m.base.push({ x: V.x - ux * half * len, y: V.y - uy * half * len });
    m.anim.push({ ax: 0, ay: 0, px: 0, py: 0, sx: 0, sy: 0 });
    m.spike.push({ a: cd.v, b: cd.n, t: 0, off: -half });

    const id2 = m.base.length;
    m.base.push({ x: V.x + ux * half * len, y: V.y + uy * half * len });
    m.anim.push({ ax: 0, ay: 0, px: 0, py: 0, sx: 0, sy: 0 });
    m.spike.push({ a: cd.v, b: cd.n, t: 0, off: half });

    const sideOf = (x: number, y: number) => (x - V.x) * ux + (y - V.y) * uy;

    // A két oldalsó lap egy-egy végpontot kap (marad hatszög).
    for (const fi of cd.ab) {
      const ring = m.hexes[fi].vertexIds;
      const k = ring.indexOf(cd.v);
      if (k < 0) continue;
      ring[k] = sideOf(m.hexes[fi].cx, m.hexes[fi].cy) > 0 ? id2 : id1;
    }

    // A szemközti lap MINDKETTŐT megkapja → hétszög. A sorrendet a gyűrű
    // körüljárása adja: az előző csúcs oldalán lévő végpont jön előbb.
    const ringC = m.hexes[cd.c].vertexIds;
    const k = ringC.indexOf(cd.v);
    if (k >= 0) {
      const prev = m.base[ringC[(k - 1 + ringC.length) % ringC.length]];
      const first = sideOf(prev.x, prev.y) > 0 ? id2 : id1;
      const second = first === id1 ? id2 : id1;
      ringC.splice(k, 1, first, second);
    }

    // A tű: rövid alap (V1–V2) + két hosszú oldal N-ig.
    const P1 = m.base[id1];
    const P2 = m.base[id2];
    m.hexes.push({
      index: m.hexes.length,
      cx: (P1.x + P2.x + N.x) / 3,
      cy: (P1.y + P2.y + N.y) / 3,
      vertexIds: [id1, id2, cd.n],
      revealed: false,
      spike: true,
    });
  }
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
  const s = mesh.spike[id];
  if (s) {
    // Származtatott pont: mindig a két végpont AKTUÁLIS helyzetéhez képest
    // ül az élen, így a háromszög sosem szakad el a hálótól.
    const a = vertexAt(mesh, s.a, tSec);
    const b = vertexAt(mesh, s.b, tSec);
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    return {
      x: a.x + dx * s.t - dy * s.off,
      y: a.y + dy * s.t + dx * s.off,
    };
  }
  const b = mesh.base[id];
  const a = mesh.anim[id];
  return {
    x: b.x + Math.sin(tSec * a.sx + a.px) * a.ax,
    y: b.y + Math.cos(tSec * a.sy + a.py) * a.ay,
  };
}
