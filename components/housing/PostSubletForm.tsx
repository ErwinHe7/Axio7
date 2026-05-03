'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';

export function PostSubletForm() {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setResult(null);
    const form = new FormData(e.currentTarget);
    const payload = {
      title: String(form.get('title') || ''),
      neighborhood: String(form.get('neighborhood') || ''),
      borough: String(form.get('borough') || 'Manhattan'),
      address: String(form.get('address') || ''),
      price: Number(form.get('price') || 0),
      deposit: Number(form.get('deposit') || 0),
      brokerFee: Number(form.get('brokerFee') || 0),
      moveInDate: String(form.get('moveInDate') || ''),
      leaseEndDate: String(form.get('leaseEndDate') || ''),
      leaseTerm: 'sublet',
      roomType: String(form.get('roomType') || 'private_room'),
      furnished: form.get('furnished') === 'on',
      noFee: form.get('noFee') === 'on',
      amenities: String(form.get('amenities') || '').split(',').map((x) => x.trim()).filter(Boolean),
      description: String(form.get('description') || ''),
      sourceType: 'student_sublet',
      images: [],
    };
    try {
      const res = await fetch('/api/housing/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? 'Failed to submit sublet');
      setResult(data);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to submit sublet');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="rounded-[24px] border p-5" style={{ background: 'var(--lt-surface)', borderColor: 'var(--lt-border)' }}>
      <h2 className="text-xl font-black text-white">Sublet details</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Field name="title" label="Title" placeholder="Columbia summer sublet near 116th" />
        <Field name="neighborhood" label="Neighborhood" placeholder="Morningside Heights" />
        <Field name="borough" label="Borough" placeholder="Manhattan" defaultValue="Manhattan" />
        <Field name="address" label="Cross street / area" placeholder="Broadway & W 116th" />
        <Field name="price" label="Monthly rent" type="number" placeholder="1800" />
        <Field name="deposit" label="Deposit" type="number" placeholder="1800" />
        <Field name="brokerFee" label="Broker fee" type="number" placeholder="0" />
        <Field name="moveInDate" label="Move-in date" type="date" />
        <Field name="leaseEndDate" label="Lease end date" type="date" />
        <label className="space-y-1 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--r-text3)' }}>
          Room type
          <select name="roomType" className="w-full rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2.5 text-sm font-normal normal-case tracking-normal text-white outline-none">
            <option value="private_room">Private room</option>
            <option value="shared_room">Shared room</option>
            <option value="studio">Studio</option>
            <option value="1b1b">1B1B</option>
          </select>
        </label>
        <Field name="amenities" label="Amenities" placeholder="furnished, laundry, video tour" />
      </div>
      <label className="mt-3 block space-y-1 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--r-text3)' }}>
        Description + proof/permission notes
        <textarea name="description" required minLength={20} rows={5} className="w-full rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2.5 text-sm font-normal normal-case tracking-normal text-white outline-none" placeholder="Include lease permission, video tour availability, building proof, utilities, and any house rules." />
      </label>
      <div className="mt-3 flex flex-wrap gap-4 text-sm" style={{ color: 'var(--r-text2)' }}>
        <label className="inline-flex items-center gap-2"><input name="furnished" type="checkbox" className="accent-pink-400" /> Furnished</label>
        <label className="inline-flex items-center gap-2"><input name="noFee" type="checkbox" className="accent-pink-400" defaultChecked /> No broker fee</label>
      </div>
      <div className="mt-4 flex flex-wrap gap-3">
        <button disabled={busy} className="r-btn-pink" type="submit">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Submit for risk check →</button>
        <Link href="/housing/listings" className="r-btn-ghost">View listings</Link>
      </div>
      {error && <div className="mt-4 rounded-2xl border border-red-300/20 bg-red-300/10 p-4 text-sm text-red-100"><AlertTriangle className="mr-2 inline h-4 w-4" />{error}</div>}
      {result && (
        <div className="mt-4 rounded-2xl border border-emerald-300/20 bg-emerald-300/10 p-4 text-sm text-emerald-100">
          <CheckCircle2 className="mr-2 inline h-4 w-4" />Submitted as {result.listing?.status}. Risk: {result.risk?.riskScore}/100 · {result.risk?.riskLevel}. This is queued for review before public trust badges.
        </div>
      )}
    </form>
  );
}

function Field({ name, label, type = 'text', placeholder, defaultValue }: { name: string; label: string; type?: string; placeholder?: string; defaultValue?: string }) {
  return (
    <label className="space-y-1 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--r-text3)' }}>
      {label}
      <input name={name} type={type} placeholder={placeholder} defaultValue={defaultValue} required={name === 'title' || name === 'neighborhood' || name === 'price'} className="w-full rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2.5 text-sm font-normal normal-case tracking-normal text-white outline-none" />
    </label>
  );
}
