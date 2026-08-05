import { notFound } from "next/navigation";
import SlideDeck from "@/components/SlideDeck";
import { getPage, pages } from "@/lib/pages";

export function generateStaticParams() {
  return pages.map((p) => ({ slug: p.slug }));
}

export default async function EditorPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = getPage(slug);
  if (!page) notFound();

  return (
    <>
      <SlideDeck page={page} editable />
      <a className="mesh-back" href="/">
        ← galéria
      </a>
    </>
  );
}
