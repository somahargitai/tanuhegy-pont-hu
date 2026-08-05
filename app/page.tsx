import QRCard from "@/components/QRCard";
import { pages } from "@/lib/pages";
import { asset } from "@/lib/basePath";

export default function Home() {
  return (
    <main className="home">
      <h1>Anna – hatszög galéria</h1>
      <p className="lead">
        Olvasd be a QR kódokat mobillal, vagy koppints egy kártyára. Minden
        oldalon egy animált hatszög-térháló mögött bújik meg egy fekete-fehér
        kép. A „szerkesztő" linkkel jelölheted ki, mely hatszögek átlátszóak.
      </p>
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
  );
}
