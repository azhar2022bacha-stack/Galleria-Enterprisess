'use client';

import { useEffect, useRef, useState } from 'react';
import { Crop, RotateCw, X, ZoomIn, ZoomOut } from 'lucide-react';

const SIZE = 512;

interface ProfilePhotoEditorProps {
  src: string;
  variant?: 'profile' | 'logo';
  onCancel: () => void;
  onSave: (photo: string) => Promise<void>;
}

export function ProfilePhotoEditor({ src, variant = 'profile', onCancel, onSave }: ProfilePhotoEditorProps) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const drag = useRef<{ x: number; y: number } | null>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const isLogo = variant === 'logo';
  const minZoom = isLogo ? 0.25 : 1;
  const title = isLogo ? 'Adjust shop logo' : 'Adjust profile photo';

  useEffect(() => {
    const next = new Image();
    next.onload = () => setImage(next);
    next.onerror = () => setError('Could not open this image.');
    next.src = src;
    return () => { next.onload = null; next.onerror = null; };
  }, [src]);

  useEffect(() => {
    const ctx = canvas.current?.getContext('2d');
    if (!ctx || !image) return;
    ctx.clearRect(0, 0, SIZE, SIZE);
    if (!isLogo) {
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, SIZE, SIZE);
    }
    const sideways = rotation % 180 !== 0;
    const width = sideways ? image.naturalHeight : image.naturalWidth;
    const height = sideways ? image.naturalWidth : image.naturalHeight;
    const fit = isLogo ? Math.min : Math.max;
    const scale = fit(SIZE / width, SIZE / height) * zoom;
    const drawnWidth = image.naturalWidth * scale;
    const drawnHeight = image.naturalHeight * scale;
    ctx.save();
    ctx.translate(SIZE / 2 + offset.x, SIZE / 2 + offset.y);
    ctx.rotate(rotation * Math.PI / 180);
    ctx.drawImage(image, -drawnWidth / 2, -drawnHeight / 2, drawnWidth, drawnHeight);
    ctx.restore();
  }, [image, isLogo, offset, rotation, zoom]);

  async function saveImage() {
    if (!image || !canvas.current) return;
    setBusy(true);
    setError('');
    try {
      await onSave(canvas.current.toDataURL(isLogo ? 'image/png' : 'image/jpeg', 0.9));
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Could not save this image.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 p-4">
      <section role="dialog" aria-modal="true" aria-label={title} className="max-h-full w-full max-w-md overflow-y-auto rounded-2xl bg-white p-4 sm:p-5"
        onKeyDown={(event) => { if (event.key === 'Escape' && !busy) onCancel(); }}>
        <header className="mb-2 flex items-center justify-between">
          <h2 className="font-bold">{title}</h2>
          <button autoFocus type="button" aria-label="Close editor" disabled={busy} onClick={onCancel} className="rounded p-2"><X size={20} /></button>
        </header>
        <p className="mb-3 text-xs text-gray-600">{isLogo ? 'Drag to reposition. The circle shows how the logo fits in your account icon.' : 'Drag to position. The square area will be cropped and saved.'}</p>
        <div className="relative mx-auto max-w-[min(100%,45dvh)] overflow-hidden rounded-xl border bg-gray-100">
          <canvas ref={canvas} width={SIZE} height={SIZE} className="block w-full touch-none cursor-move"
            onPointerDown={(event) => {
              event.currentTarget.setPointerCapture(event.pointerId);
              drag.current = { x: event.clientX, y: event.clientY };
            }}
            onPointerMove={(event) => {
              if (!drag.current) return;
              const scale = SIZE / event.currentTarget.getBoundingClientRect().width;
              const dx = (event.clientX - drag.current.x) * scale;
              const dy = (event.clientY - drag.current.y) * scale;
              setOffset((previous) => ({ x: previous.x + dx, y: previous.y + dy }));
              drag.current = { x: event.clientX, y: event.clientY };
            }}
            onPointerUp={() => { drag.current = null; }}
            onPointerCancel={() => { drag.current = null; }}
            onLostPointerCapture={() => { drag.current = null; }} />
          <div className="pointer-events-none absolute inset-0 rounded-full border-2 border-gray-400" />
        </div>
        <div className="my-3 flex flex-wrap items-center justify-center gap-2">
          <button type="button" aria-label="Zoom out" title="Zoom out" className="rounded-lg p-2 hover:bg-gray-100 disabled:opacity-40" disabled={zoom <= minZoom} onClick={() => setZoom((value) => Math.max(minZoom, value - 0.1))}><ZoomOut size={21} /></button>
          <span className="min-w-10 text-center text-xs tabular-nums">{Math.round(zoom * 100)}%</span>
          <button type="button" aria-label="Zoom in" title="Zoom in" className="rounded-lg p-2 hover:bg-gray-100 disabled:opacity-40" disabled={zoom >= 4} onClick={() => setZoom((value) => Math.min(4, value + 0.1))}><ZoomIn size={21} /></button>
          <button type="button" aria-label="Rotate clockwise" title="Rotate clockwise" className="rounded-lg p-2 hover:bg-gray-100" onClick={() => { setRotation((value) => (value + 90) % 360); setOffset({ x: 0, y: 0 }); }}><RotateCw size={21} /></button>
          <button type="button" aria-label="Reset adjustments" title="Reset adjustments" className="rounded-lg p-2 hover:bg-gray-100" onClick={() => { setZoom(1); setRotation(0); setOffset({ x: 0, y: 0 }); }}><Crop size={21} /></button>
        </div>
        {error && <p role="alert" className="mb-2 text-xs text-red-700">{error}</p>}
        <div className="flex gap-2">
          <button type="button" disabled={busy} onClick={onCancel} className="flex-1 rounded-lg border p-2">Cancel</button>
          <button type="button" disabled={busy || !image} onClick={saveImage} className="flex-1 rounded-lg bg-emerald-700 p-2 text-white disabled:opacity-50">
            {busy ? 'Saving…' : isLogo ? 'Use logo' : 'Crop & save'}
          </button>
        </div>
      </section>
    </div>
  );
}
