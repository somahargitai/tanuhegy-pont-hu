import type { Metadata } from "next";
import QRCard from "@/components/QRCard";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { pages } from "@/lib/pages";
import { asset } from "@/lib/basePath";

export const metadata: Metadata = {
  title: "Galéria – bazalt",
  description: "A hatszög-térhálós oldalak és a hozzájuk tartozó QR kódok.",
};

export default function GaleriaPage() {
  return (
    <>
      <SiteHeader current="/galeria" />
      <main className="page">
        <div className="page-head">
          <h1>Galéria</h1>
          <p className="lead">
            Olvasd be a QR kódokat mobillal, vagy koppints egy kártyára. Minden
            oldalon egy animált hatszög-térháló mögött bújik meg egy fekete-fehér
            kép. A „szerkesztő” linkkel jelölheted ki, mely hatszögek átlátszóak.
          </p>
        </div>

        <div className="qr-grid">
          {pages.map((p) => (
            <div key={p.slug} className="qr-item">
              <QRCard slug={p.slug} title={p.title} />
              <a className="editor-link" href={asset(`/editor/${p.slug}`)}>
                ✎ szerkesztő
              </a>
            </div>
          ))}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
