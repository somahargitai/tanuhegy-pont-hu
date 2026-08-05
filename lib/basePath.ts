/**
 * Alap-útvonal (base path) kezelés.
 *
 * A GitHub Pages projekt-oldalak nem a domain gyökerén élnek, hanem
 * `https://<user>.github.io/<repo>/` alatt. Ezért minden gyökérből induló
 * útvonal elé kell egy előtag. A Next ezt a `<Link>`-eknél és a `next/image`-nél
 * magától megteszi, de a NYERS `<img src>`-eknél és a canvasba töltött képeknél
 * nem – azokat nekünk kell előtagolni.
 *
 * Az érték build időben égetődik be a `NEXT_PUBLIC_BASE_PATH`-ból. Üresen hagyva
 * (helyi fejlesztés, Vercel) minden a gyökérről megy, tehát semmi sem változik.
 */

/**
 * "/q-banya/", "q-banya", "/" stb. -> "/q-banya" ill. "".
 * FONTOS: a `next.config.mjs` ugyanezt a normalizálást végzi – ha itt
 * változtatsz, ott is át kell írni.
 */
export function normalizeBasePath(raw?: string): string {
  if (!raw || raw === "/") return "";
  const withLeading = raw.startsWith("/") ? raw : `/${raw}`;
  return withLeading.replace(/\/+$/, "");
}

export const BASE_PATH = normalizeBasePath(process.env.NEXT_PUBLIC_BASE_PATH);

/**
 * "Hamarosan" mód: az éles oldalon egyelőre CSAK a kép látszik.
 *
 * Build időben kapcsolható, nem ágfüggő – így a `main` és a `dev` kódja
 * ugyanaz maradhat, és a merge-ök nem ütköznek. A GitHub Pages workflow
 * bekapcsolja, a Vercel (dev) build nem, ezért ott az egész oldal látszik.
 * Ha kész a projekt: vedd ki a workflow-ból a `NEXT_PUBLIC_COMING_SOON`-t.
 */
export const COMING_SOON = process.env.NEXT_PUBLIC_COMING_SOON === "1";

/** Gyökérből induló útvonal elé teszi a base path-t. Relatív utat nem bánt. */
export function asset(path: string): string {
  return path.startsWith("/") ? `${BASE_PATH}${path}` : path;
}
