import type { RevealSpec } from "./hexMesh";

export type PageConfig = {
  slug: string;
  title: string;
  /** Kép a /public alól, ami a háló mögött látszik (fekete-fehérben). */
  image: string;
  /** A maszk (a nem-átlátszó hatszögek) színe – tartsd monokrómnak. */
  overlay?: string;
  /** Hatszög sugara px-ben (nagyobb = kevesebb, nagyobb csempe). */
  hexRadius?: number;
  /** Determinisztikus seed a szabálytalansághoz és a feltáráshoz. */
  seed?: number;
  /** Szabálytalanság mértéke (0..0.4). */
  jitter?: number;
  /** Melyik hatszögek átlátszóak (foltok vagy pontos indexek). */
  reveal?: RevealSpec;
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
    overlay: "#0b0b0b",
    hexRadius: 150,
    seed: 101,
    reveal: { clusters: 4 },
  },
  {
    slug: "banya-2",
    title: "Bánya – II.",
    image: "/images/qbanya2.jpg",
    overlay: "#0b0b0b",
    hexRadius: 172,
    seed: 202,
    reveal: { clusters: 3 },
  },
];

export function getPage(slug: string): PageConfig | undefined {
  return pages.find((p) => p.slug === slug);
}
