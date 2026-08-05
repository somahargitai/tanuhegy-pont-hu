import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { asset } from "@/lib/basePath";

/*
 * VÁZ – minden szöveg placeholder. A szerkezet a végleges, a tartalom nem.
 */

export const metadata: Metadata = {
  title: "A projektről – bazalt",
  description: "Placeholder leírás a projektről.",
};

const SECTIONS = [
  {
    id: "hatter",
    title: "Placeholder — Háttér",
    paragraphs: [
      "Ide kerül a projekt kiindulópontja: miért készült, mi a témája. Két-három bekezdés.",
      "Második bekezdés helye. Ha kell, itt lehet hosszabban is kifejteni a gondolatot.",
    ],
  },
  {
    id: "modszer",
    title: "Placeholder — Módszer",
    paragraphs: [
      "Hogyan készültek a képek és a hatszög-térháló. Mi történik, amikor a néző beolvassa a QR kódot.",
    ],
  },
  {
    id: "forrasok",
    title: "Placeholder — Források",
    paragraphs: [
      "A felhasznált archív képek és szövegek megnevezése, a jogi háttér tisztázása.",
    ],
  },
];

const FACTS = [
  { label: "Év", value: "PLACEHOLDER" },
  { label: "Technika", value: "PLACEHOLDER" },
  { label: "Méret", value: "PLACEHOLDER" },
  { label: "Helyszín", value: "PLACEHOLDER" },
];

export default function ProjektPage() {
  return (
    <>
      <SiteHeader current="/projekt" />

      <main className="page">
        <div className="page-head">
          <p className="hero-kicker">PLACEHOLDER — alcím</p>
          <h1>A projektről</h1>
          <p className="lead">
            Placeholder bevezető bekezdés: egy tömör összefoglaló, ami önmagában
            is megállja a helyét, ha valaki csak ezt olvassa el.
          </p>
        </div>

        <div className="article">
          <article className="article-body">
            {SECTIONS.map((s) => (
              <section key={s.id} id={s.id}>
                <h2>{s.title}</h2>
                {s.paragraphs.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </section>
            ))}

            <p className="article-cta">
              <a className="btn btn-primary" href={asset("/galeria")}>
                Ugrás a galériához
              </a>
            </p>
          </article>

          {/* Oldalsáv: nagy képernyőn a szöveg mellé, mobilon alá kerül. */}
          <aside className="article-aside">
            <h2 className="aside-title">Adatok</h2>
            <dl className="facts">
              {FACTS.map((f) => (
                <div key={f.label}>
                  <dt>{f.label}</dt>
                  <dd>{f.value}</dd>
                </div>
              ))}
            </dl>
          </aside>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
