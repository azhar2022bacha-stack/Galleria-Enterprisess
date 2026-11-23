'use client';
import { useEffect, useRef, useState } from 'react';

export function RejectionReasonDialog({ kind, onCancel, onReject }: {
  kind: 'recharge' | 'withdrawal';
  onCancel: () => void;
  onReject: (reason: string) => Promise<void>;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    return () => element?.close();
  }, []);
  return <dialog ref={dialog} aria-labelledby="reject-request-title" className="m-auto w-full max-w-sm rounded-xl p-5 shadow-lg backdrop:bg-black/40"
    onCancel={event => { event.preventDefault(); if (!busy) onCancel(); }}>
    <form onSubmit={async event => {
      event.preventDefault();
      if (!reason.trim() || busy) return;
      setBusy(true); setError('');
      try { await onReject(reason.trim()); onCancel(); }
      catch (err) { setError(err instanceof Error ? err.message : 'Unable to reject the request.'); setBusy(false); }
    }}>
      <h2 id="reject-request-title" className="font-semibold">Reject {kind} request?</h2>
      <label className="mt-4 block text-sm">Reason
        <textarea autoFocus required disabled={busy} maxLength={kind === 'withdrawal' ? 500 : 1000} value={reason} onChange={e=>setReason(e.target.value)}
          className="mt-1 block w-full rounded border p-2" rows={3} placeholder="Explain the reason to the seller" />
      </label>
      {error && <p role="alert" className="mt-2 text-sm text-red-700">{error}</p>}
      <div className="mt-4 flex justify-end gap-3"><button type="button" disabled={busy} onClick={onCancel}>Cancel</button>
        <button disabled={!reason.trim() || busy} className="rounded bg-red-700 px-4 py-2 text-white disabled:opacity-50">{busy ? 'Rejecting…' : 'Reject'}</button></div>
    </form>
  </dialog>;
}
