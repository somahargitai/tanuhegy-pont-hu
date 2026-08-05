/**
 * FONTOS: ez a normalizálás megegyezik a `lib/basePath.ts`-belivel.
 * Ha itt változtatsz, ott is át kell írni (a kliens oldali `asset()` onnan
 * dolgozik).
 */
function normalizeBasePath(raw) {
  if (!raw || raw === "/") return "";
  const withLeading = raw.startsWith("/") ? raw : `/${raw}`;
  return withLeading.replace(/\/+$/, "");
}

// GitHub Pages projekt-oldalnál pl. "/q-banya"; Vercelen és helyben üres.
const basePath = normalizeBasePath(process.env.NEXT_PUBLIC_BASE_PATH);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Teljesen statikus kimenet az `out/` mappába: nincs szerver, nincs API
  // route, nincs ISR – minden útvonal előre legenerálódik. Ugyanez a build fut
  // ki GitHub Pages-re és Vercelre is.
  output: "export",

  // Minden útvonal saját mappát kap (`/banya-1/index.html`), ami a GitHub Pages
  // statikus kiszolgálásával biztosan működik.
  trailingSlash: true,

  basePath,
  assetPrefix: basePath || undefined,

  // Statikus exportnál nincs futásidejű képoptimalizálás. (Az oldal amúgy is
  // sima <img>-et és canvast használ, nem a next/image-et.)
  images: { unoptimized: true },
};

export default nextConfig;
