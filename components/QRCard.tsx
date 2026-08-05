"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

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
    const full = `${window.location.origin}/${slug}`;
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
    <a className="qr-card" href={`/${slug}`}>
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
        <div className="qr-url">{href || `/${slug}`}</div>
      </div>
    </a>
  );
}
