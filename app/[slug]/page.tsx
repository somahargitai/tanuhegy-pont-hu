import { notFound } from "next/navigation";
import SlideDeck from "@/components/SlideDeck";
import { getPage, pages } from "@/lib/pages";
import { asset } from "@/lib/basePath";

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
    <>
      <SlideDeck page={page} />
      <a className="mesh-back" href={asset("/galeria")}>
        ← galéria
      </a>
    </>
  );
}
