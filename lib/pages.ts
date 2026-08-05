import type { RevealSpec, SpikeSpec } from "./hexMesh";

/** Egy szövegblokk a slide 1080×1920-as terében. */
export type TextBlock = {
  /** Melyik slide-hoz tartozik (0-tól). A szöveg ezzel a slide-dal együtt mozog. */
  slide: number;
  /** Bal szél a slide saját koordinátáiban. */
  x: number;
  /** Az ELSŐ sor alapvonala (baseline) a slide saját koordinátáiban. */
  baseline: number;
  /** Betűméret tervezési pixelben. Alap: 40. */
  size?: number;
  /** Sortávolság tervezési pixelben. Alap: 48. */
  lineHeight?: number;
  /** Szövegszín. Alap: fehér. */
  color?: string;
  /** A sorok. Üres sor = kihagyott sor (a tervben így vannak a blokkok elválasztva). */
  lines: string[];
};

/** A maszk (overlay) színe egy téglalapon belül – a tervben a bal oldali
 *  szürke panel és a fekete háttér így válik ketté. */
export type OverlayRect = {
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
};

/** A felső geometrikus felirat egy darabja a teljes vászon koordinátáiban. */
export type TitlePart = {
  src: string;
  /** Bal szél a TELJES vászon koordinátáiban (0 .. slides*1080). */
  x: number;
  y: number;
  w: number;
  h: number;
};

export type PageConfig = {
  slug: string;
  title: string;
  /** Kép a /public alól, ami a háló mögött látszik (fekete-fehérben). */
  image: string;
  /** Hány slide széles a vászon. Alap: 1 (nincs swipe). */
  slides?: number;
  /** A maszk (a nem-átlátszó hatszögek) alapszíne – tartsd monokrómnak. */
  overlay?: string;
  /** Az alapszíntől eltérő maszk-területek (a teljes vászon koordinátáiban). */
  overlayRects?: OverlayRect[];
  /** A felső geometrikus felirat – a slide-okon átívelő, egybefüggő réteg. */
  titleParts?: TitlePart[];
  /** Slide-hoz kötött szövegblokkok. */
  texts?: TextBlock[];
  /** Hatszög sugara px-ben (nagyobb = kevesebb, nagyobb csempe). */
  hexRadius?: number;
  /** Determinisztikus seed a szabálytalansághoz és a feltáráshoz. */
  seed?: number;
  /** Szabálytalanság mértéke (0..0.4). */
  jitter?: number;
  /** Melyik hatszögek átlátszóak (foltok vagy pontos indexek). */
  reveal?: RevealSpec;
  /** Vékony, hosszú háromszögek („tüskék") beszúrása a rácsba. */
  spikes?: SpikeSpec;
  /** A rácsvonalak átlátszatlansága (0..1). Alap: 0.42. */
  lineOpacity?: number;
  /** A rácsvonalak színe ("none" = nem látszik). Alap: "white". */
  lineColor?: "black" | "white" | "none";
  /** A kijelölt (átlátszó) csempék határvonalának átlátszatlansága. Alap: 0.85. */
  borderOpacity?: number;
  /** A kijelölt csempék határvonalának színe ("none" = nem látszik). Alap: "white". */
  borderColor?: "black" | "white" | "none";
  /** A csúcsok mozgási sebességének szorzója (0 = áll). Alap: 1. */
  speed?: number;
};

// Ide vedd fel az oldalakat. Minden slug egy külön útvonal (/slug), és a
// kezdőlapon mindegyikhez generálódik egy QR kód. Minden fekete-fehér.
export const pages: PageConfig[] = [
  {
    slug: "banya-1",
    title: "Bánya – I.",
    image: "/images/qbanya1.jpg",
    slides: 3,
    overlay: "#000000",
    // Az első slide-on a maszk a terv szerinti szürke panel, utána fekete.
    overlayRects: [
      { x: 0, y: 0, w: 1080, h: 1920, color: "#2e2d2c" },
      { x: 1080, y: 1203, w: 1080, h: 717, color: "#2e2d2c" },
    ],
    // A "pusztítás" felirat két darabban: az első slide-on fehér, onnantól
    // a háttérbe olvadó sötétszürke. A két darab pontosan illeszkedik.
    titleParts: [
      { src: "/pusztitas-1.svg", x: 0, y: 0, w: 1080, h: 1920 },
      { src: "/pusztitas-2.svg", x: 1080, y: 0, w: 2160, h: 1920 },
    ],
    texts: [
      {
        slide: 0,
        x: 316.5,
        baseline: 694.7,
        lines: [
          "Annál is inkább védelem alá",
          "veendők a Kőkapu remek sziklái,",
          "minthogy itt  a vékony lemezekre",
          "és a táblára hasadozó bazalt",
          "fejtésre nem ajánlható.",
        ],
      },
      {
        slide: 0,
        x: 163.5,
        baseline: 1016.9,
        lines: [
          "A második Badacsony hegyi",
          "megvédésre méltó",
          "természeti szépség,",
          "a hegy déli erdős-",
          "koszorúján lévő páratlan",
          "érdekességű és tudományos",
          "tekintetben értékes",
          "sziklákon van.",
          "A Péntek-árok fejétől,",
          "a hegy déli oldalán végig",
          "a lábdi szőlők tördemici végéig",
          "terjedő, mintegy egy és fél",
          "kilométer vízszintes",
          "kiterjedésű hatalmas",
          "kőoszlopok és sziklák szintén",
          "okvetlenül megvédendők.",
        ],
      },
      {
        slide: 1,
        x: 559,
        baseline: 1367.2,
        lines: [
          "A Badacsonynak",
          "a tófelé tekintő oldala",
          "ezekben viseli remek",
          "természeti jellegét,",
          "amelynek elvesztése",
          "barbarizmus volna.",
        ],
      },
      {
        slide: 2,
        x: 633,
        baseline: 691,
        size: 35,
        lineHeight: 42,
        color: "#2d2d2d",
        lines: ["Fotó:", "tördemici kőfejtő 1950", "Fortepan / UVATERV"],
      },
      {
        slide: 2,
        x: 633,
        baseline: 1454.3,
        size: 35,
        lineHeight: 42,
        color: "#2d2d2d",
        lines: [
          "Lóczy Lajos",
          "fölterjesztése",
          "a földművelésügyi",
          "miniszterhez",
          "",
          "Budapesti Hírlap,",
          "1928.05.13. / 109. szám",
        ],
      },
    ],
    hexRadius: 150,
    seed: 101,
    // A terv szerinti helyeken nyílik ki a rács: az 1. slide jobb alsó
    // sarkától átívelve a 2.-on át a 3. slide közepéig – a szövegek szabadon
    // maradnak.
    reveal: {
      spots: [
        { x: 880, y: 1300, r: 380 },
        { x: 1240, y: 950, r: 400 },
        { x: 1370, y: 1330, r: 270 },
        { x: 2120, y: 900, r: 380 },
        { x: 2420, y: 1180, r: 380 },
      ],
    },
    // Néhány rácspont helyére rövid szakasz kerül, és onnan lóg le egy
    // közel függőleges, hegyesszögű tű.
    spikes: { count: 3, width: 0.2 },
  },
  {
    slug: "banya-2",
    title: "Bánya – II.",
    image: "/images/qbanya2.jpg",
    overlay: "#0b0b0b",
    titleParts: [
      { src: "/bazalt_text_1.svg", x: 75, y: 402, w: 929, h: 1115 },
    ],
    hexRadius: 172,
    seed: 202,
    reveal: { clusters: 3 },
  },
];

export function getPage(slug: string): PageConfig | undefined {
  return pages.find((p) => p.slug === slug);
}
