import { asset } from "@/lib/basePath";

const NAV = [
  { href: "/", label: "Kezdőlap" },
  { href: "/projekt", label: "A projektről" },
  { href: "/galeria", label: "Galéria" },
];

/**
 * Fejléc a "normál" (nem teljes képernyős) oldalakhoz. A hatszög-oldalak
 * (/banya-1 stb.) szándékosan nem használják – ott semmi nem takarhatja a képet.
 */
export default function SiteHeader({ current }: { current?: string }) {
  return (
    <header className="site-header">
      <a className="site-brand" href={asset("/")}>
        {/* PLACEHOLDER: ide jön a végleges logó/névjelzés */}
        bazalt
      </a>
      <nav className="site-nav" aria-label="Fő navigáció">
        {NAV.map((item) => (
          <a
            key={item.href}
            href={asset(item.href)}
            aria-current={item.href === current ? "page" : undefined}
          >
            {item.label}
          </a>
        ))}
      </nav>
    </header>
  );
}
