"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { asset } from "@/lib/basePath";

export default function QRCard({
  slug,
  title,
}: {
  slug: string;
  title: string;
}) {
  const [href, setHref] = useState("");
  const [dataUrl, setDataUrl] = useState("");

  useEffect(() => {
    const full = `${window.location.origin}${asset(`/${slug}`)}`;
    setHref(full);
    QRCode.toDataURL(full, {
      margin: 1,
      width: 320,
      color: { dark: "#111111", light: "#ffffff" },
    })
      .then(setDataUrl)
      .catch(() => setDataUrl(""));
  }, [slug]);

  return (
    <a className="qr-card" href={asset(`/${slug}`)}>
      <div className="qr-imgwrap">
        {dataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={dataUrl} alt={`QR – ${title}`} width={160} height={160} />
        ) : (
          <div className="qr-placeholder" />
        )}
      </div>
      <div className="qr-meta">
        <div className="qr-title">{title}</div>
        <div className="qr-url">{href || asset(`/${slug}`)}</div>
      </div>
    </a>
  );
}
