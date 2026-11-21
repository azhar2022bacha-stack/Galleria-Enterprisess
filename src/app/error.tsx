'use client';

import { useEffect } from 'react';

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Page failed to render:', error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#fbfaf7] px-5 py-12 text-[#17283e]">
      <section role="alert" className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-7 shadow-xl sm:p-10">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#9c7b25]">Galleria Enterprises</p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">This page hit an error</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          The page did not finish loading. Try again; if it keeps happening, share the browser console error with support.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl bg-[#101b2d] px-5 text-sm font-semibold text-white transition hover:bg-[#1a2b44] focus:outline-none focus:ring-4 focus:ring-[#d7bc68]/30"
        >
          Try again
        </button>
      </section>
    </main>
  );
}
