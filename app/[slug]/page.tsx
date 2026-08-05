import { notFound } from "next/navigation";
import HexMesh from "@/components/HexMesh";
import { getPage, pages } from "@/lib/pages";

export function generateStaticParams() {
  return pages.map((p) => ({ slug: p.slug }));
}

export default async function MeshPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = getPage(slug);
  if (!page) notFound();

  return (
    <div className="mesh-page">
      <HexMesh page={page} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="mesh-logo" src="/bazalt_text_1.svg" alt="" aria-hidden />
      <a className="mesh-back" href="/">
        ← galéria
      </a>
    </div>
  );
}
