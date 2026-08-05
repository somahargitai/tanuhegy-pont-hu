import { asset } from "@/lib/basePath";

/**
 * Amíg a projekt nem kész, az éles oldalon CSAK ez látszik: a kép, középen,
 * fekete háttéren. Semmi más – se navigáció, se szöveg.
 */
export default function ComingSoon() {
  return (
    <main className="coming-soon">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={asset("/bazalt-06.jpg")} alt="Bazalt" />
    </main>
  );
}
