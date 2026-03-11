"use client";

import { useCallback, useRef } from "react";

export function NewsletterIframe({ html }: { html: string }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handleLoad = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const doc = iframe.contentDocument;
    if (!doc) return;

    // Resize to fit content
    const height = doc.documentElement.scrollHeight;
    iframe.style.height = `${height}px`;
  }, []);

  return (
    <iframe
      ref={iframeRef}
      srcDoc={html}
      sandbox="allow-same-origin"
      onLoad={handleLoad}
      title="Newsletter content"
      className="w-full border-0 min-h-[400px]"
      style={{ colorScheme: "light" }}
    />
  );
}
