import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { pages } from "@/lib/pages";
import { asset } from "@/lib/basePath";

/*
 * VÁZ – minden szöveg placeholder. A szerkezet a végleges, a tartalom nem.
 * Keresd a "PLACEHOLDER" jelöléseket.
 */

const FEATURES = [
  {
    title: "Placeholder – első blokk",
    body: "Rövid bekezdés arról, mi ez a projekt. Két-három mondat, nem több.",
  },
  {
    title: "Placeholder – második blokk",
    body: "Mit lát a látogató, ha beolvassa a QR kódot. Két-három mondat.",
  },
  {
    title: "Placeholder – harmadik blokk",
    body: "Honnan származnak a képek és a szövegek. Két-három mondat.",
  },
];

export default function LandingPage() {
  return (
    <>
      <SiteHeader current="/" />

      <main>
        {/* --- Hero ------------------------------------------------------- */}
        <section className="hero">
          <p className="hero-kicker">PLACEHOLDER — alcím vagy évszám</p>
          <h1 className="hero-title">
            Placeholder
            <br />
            főcím
          </h1>
          <p className="hero-lead">
            Placeholder bevezető: egy-két mondat, ami elmondja, miről szól a
            projekt. Ide kerül a végleges felütés.
          </p>
          <div className="hero-actions">
            <a className="btn btn-primary" href={asset("/galeria")}>
              Galéria
            </a>
            <a className="btn" href={asset("/projekt")}>
              A projektről
            </a>
          </div>
        </section>

        {/* --- Rövid blokkok ---------------------------------------------- */}
        <section className="section">
          <div className="card-grid">
            {FEATURES.map((f) => (
              <article key={f.title} className="card">
                <h2>{f.title}</h2>
                <p>{f.body}</p>
              </article>
            ))}
          </div>
        </section>

        {/* --- Munkák felsorolása ----------------------------------------- */}
        <section className="section">
          <h2 className="section-title">Munkák</h2>
          <p className="lead">
            PLACEHOLDER — ide jön egy rövid felvezető a sorozatról.
          </p>
          <ul className="work-list">
            {pages.map((p) => (
              <li key={p.slug}>
                <a href={asset(`/${p.slug}`)}>
                  <span className="work-title">{p.title}</span>
                  <span className="work-meta">
                    {p.slides && p.slides > 1
                      ? `${p.slides} slide · swipe-olható`
                      : "egy képernyő"}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
