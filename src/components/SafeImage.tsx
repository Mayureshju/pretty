"use client";

import Image, { ImageProps } from "next/image";
import { useEffect, useState } from "react";

const DEFAULT_FALLBACK = "/images/products/placeholder.jpg";

/**
 * next/image wrapper that swaps to a local placeholder when the source fails to
 * load (broken/404/oversized remote URLs) so the UI never shows a broken image.
 */
export default function SafeImage({
  src,
  fallback = DEFAULT_FALLBACK,
  alt,
  ...rest
}: ImageProps & { fallback?: string }) {
  const [imgSrc, setImgSrc] = useState(src);

  useEffect(() => {
    setImgSrc(src);
  }, [src]);

  return (
    <Image
      {...rest}
      alt={alt}
      src={imgSrc}
      onError={() => {
        if (imgSrc !== fallback) setImgSrc(fallback);
      }}
    />
  );
}
