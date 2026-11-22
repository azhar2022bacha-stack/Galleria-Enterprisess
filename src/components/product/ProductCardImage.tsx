'use client';

import { useEffect, useRef, useState, type SyntheticEvent } from 'react';
import Image from 'next/image';
import { ImageOff } from 'lucide-react';
import { processProductImageData } from '@/lib/productImageProcessing';

const inFlightCrops = new Map<string, Promise<Blob | null>>();

function scheduleWhenIdle(task: () => void): void {
  const idleWindow = window as Window & {
    requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
  };
  if (idleWindow.requestIdleCallback) {
    idleWindow.requestIdleCallback(task, { timeout: 1500 });
    return;
  }
  window.setTimeout(task, 350);
}

function createProductCutout(image: HTMLImageElement): Promise<Blob | null> {
  return new Promise((resolve) => {
    if (!image.naturalWidth || !image.naturalHeight) return resolve(null);
    scheduleWhenIdle(() => {
      const scale = Math.min(1, 1000 / Math.max(image.naturalWidth, image.naturalHeight));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      const context = canvas.getContext('2d', { willReadFrequently: true });
      if (!context) return resolve(null);
      try {
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        const cutout = processProductImageData(context.getImageData(0, 0, canvas.width, canvas.height));
        canvas.width = cutout.width;
        canvas.height = cutout.height;
        const outputContext = canvas.getContext('2d');
        if (!outputContext) return resolve(null);
        outputContext.putImageData(cutout, 0, 0);
        canvas.toBlob(resolve, 'image/png');
      } catch {
        // Some hosts block canvas access; keep their original product image visible.
        resolve(null);
      }
    });
  });
}

function getProductCutout(source: string, image: HTMLImageElement): Promise<Blob | null> {
  const running = inFlightCrops.get(source);
  if (running) return running;
  const pending = createProductCutout(image);
  inFlightCrops.set(source, pending);
  void pending.then(() => { if (inFlightCrops.get(source) === pending) inFlightCrops.delete(source); });
  return pending;
}

export function ProductCardImage({
  src,
  alt,
  className = 'object-contain p-0',
  priority = false,
  sizes = '(max-width: 640px) 45vw, (max-width: 1024px) 28vw, 18vw',
}: {
  src?: string | null;
  alt: string;
  className?: string;
  priority?: boolean;
  sizes?: string;
}) {
  const [failed, setFailed] = useState(!src);
  const [displaySrc, setDisplaySrc] = useState(src || '');
  const activeSource = useRef(src || '');
  const objectUrl = useRef('');

  useEffect(() => {
    activeSource.current = src || '';
    setFailed(!src);
    setDisplaySrc(src || '');
    return () => {
      activeSource.current = '';
      if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
      objectUrl.current = '';
    };
  }, [src]);

  const handleImageLoad = (event: SyntheticEvent<HTMLImageElement>) => {
    if (!src || displaySrc !== src || activeSource.current !== src || src.startsWith('blob:') || src.startsWith('data:') || src.startsWith('/uploads/')) return;
    const image = event.currentTarget;
    void getProductCutout(src, image).then((blob) => {
      if (!blob || activeSource.current !== src) return;
      const nextObjectUrl = URL.createObjectURL(blob);
      if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
      objectUrl.current = nextObjectUrl;
      setDisplaySrc(nextObjectUrl);
    });
  };

  if (!src || failed) {
    return (
      <div role="img" aria-label={`${alt} image unavailable`} className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-[#f8f7f4] to-[#f0eee9] text-[#9aa2ad]">
        <ImageOff className="h-7 w-7" strokeWidth={1.4} />
        <span className="text-[9px] font-medium">Image unavailable</span>
      </div>
    );
  }

  return (
    <Image
      src={displaySrc}
      alt={alt}
      fill
      unoptimized={displaySrc.startsWith("http:")}
      priority={priority}
      sizes={sizes}
      className={className}
      onLoad={handleImageLoad}
      onError={() => setFailed(true)}
    />
  );
}
