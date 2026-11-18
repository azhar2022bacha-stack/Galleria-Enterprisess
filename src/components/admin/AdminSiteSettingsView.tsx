'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlignLeft, ArrowUpRight, BadgeCheck, Building2, CheckCircle2, Clock3, ExternalLink,
  FileBadge, FileText, Globe2, Image as ImageIcon, Instagram, LoaderCircle,
  MapPin, MessageCircle, Palette, Plus, Search, Send, ShieldCheck, Trash2, Upload,
  Globe, Phone, Save,
} from 'lucide-react';
import { DEFAULT_WEBSITE_INFO, type WebsiteCertificate, type WebsiteInfo } from '@/lib/websiteInfo';

type WebsiteInfoTab = 'overview' | 'identity' | 'contact' | 'about' | 'media' | 'policies' | 'social-seo';

const TABS: { id: WebsiteInfoTab; label: string; detail: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'overview', label: 'Overview', detail: 'Your website content at a glance', icon: Globe2 },
  { id: 'identity', label: 'Website identity', detail: 'Name, logo, and visual style', icon: Building2 },
  { id: 'contact', label: 'Contact details', detail: 'How visitors can reach you', icon: Phone },
  { id: 'about', label: 'About Us', detail: 'Your story and company details', icon: AlignLeft },
  { id: 'media', label: 'Images & certificates', detail: 'Website visuals and credentials', icon: ImageIcon },
  { id: 'policies', label: 'Policies & help', detail: 'Privacy, terms, and FAQs', icon: ShieldCheck },
  { id: 'social-seo', label: 'Social & search', detail: 'Social links and search previews', icon: Search },
];

const inputClass = 'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#a77e43] focus:ring-4 focus:ring-[#a77e43]/10';
const labelClass = 'mb-1.5 block text-xs font-semibold text-slate-700';
const hintClass = 'mt-1.5 text-[11px] leading-5 text-slate-500';

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return <div><label className={labelClass}>{label}</label>{children}{hint && <p className={hintClass}>{hint}</p>}</div>;
}

function SectionCard({ title, description, icon: Icon, children }: { title: string; description?: string; icon: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><div className="mb-5 flex items-start gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f6f2e9] text-[#987444]"><Icon className="h-4.5 w-4.5" /></span><div><h2 className="text-sm font-bold text-slate-900">{title}</h2>{description && <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-500">{description}</p>}</div></div>{children}</section>;
}

function WebsiteMediaField({
  label,
  value,
  accept = 'image/png,image/jpeg,image/webp,image/gif,image/x-icon',
  onChange,
  onUpload,
  uploading,
  fileHint = 'JPG, PNG, WebP, or GIF · up to 8 MB',
}: {
  label: string;
  value: string;
  accept?: string;
  onChange: (value: string) => void;
  onUpload: (file: File) => void;
  uploading: boolean;
  fileHint?: string;
}) {
  const isDocument = accept.includes('application/pdf');
  return <div className="rounded-xl border border-slate-200 p-3.5">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      {!isDocument && <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50">{value ? <img src={value} alt={`${label} preview`} className="h-full w-full object-contain" /> : <ImageIcon className="h-5 w-5 text-slate-300" />}</div>}
      <div className="min-w-0 flex-1"><label className={labelClass}>{label}</label><input type="url" value={value} onChange={(event) => onChange(event.target.value)} placeholder="Paste a secure HTTPS link or upload a file" className={inputClass} /><p className={hintClass}>{fileHint}</p></div>
      <label className="inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100">
        {uploading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}{uploading ? 'Uploading…' : 'Upload'}
        <input type="file" accept={accept} className="sr-only" disabled={uploading} onChange={(event) => { const file = event.target.files?.[0]; if (file) onUpload(file); event.target.value = ''; }} />
      </label>
    </div>
  </div>;
}

export function AdminSiteSettingsView({ notify }: { notify?: (message: string) => void }) {
  const [settings, setSettings] = useState<WebsiteInfo>({ ...DEFAULT_WEBSITE_INFO });
  const [activeTab, setActiveTab] = useState<WebsiteInfoTab>('overview');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploadingField, setUploadingField] = useState('');

  const loadSettings = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/website-info', { cache: 'no-store' });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || 'Unable to load website information.');
      setSettings({ ...DEFAULT_WEBSITE_INFO, ...result.settings });
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load website information.');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { void loadSettings(); }, [loadSettings]);

  const update = <K extends keyof WebsiteInfo>(key: K, value: WebsiteInfo[K]) => {
    setSettings((current) => ({ ...current, [key]: value }));
    setSuccess('');
  };

  const uploadFile = async (file: File, key: string): Promise<{ url: string; fileName: string } | null> => {
    setUploadingField(key);
    setError('');
    try {
      const data = new FormData();
      data.append('file', file);
      const response = await fetch('/api/admin/website-info/assets', { method: 'POST', body: data });
      const result = await response.json();
      if (!response.ok || !result.success || typeof result.url !== 'string') throw new Error(result.error || 'Unable to upload this file.');
      return { url: result.url, fileName: result.fileName || file.name };
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Unable to upload this file.');
      return null;
    } finally { setUploadingField(''); }
  };

  const save = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const response = await fetch('/api/website-info', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(settings) });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || 'Unable to save website information.');
      setSettings({ ...DEFAULT_WEBSITE_INFO, ...result.settings });
      setSuccess('Website information saved and published to the main website.');
      window.dispatchEvent(new CustomEvent('galleria:website-info-changed', { detail: result.settings }));
      notify?.('Website information saved and published.');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save website information.');
    } finally { setSaving(false); }
  };

  const addFaq = () => update('faqs', [...settings.faqs, { id: crypto.randomUUID(), question: '', answer: '' }]);
  const addCertificate = async (file?: File) => {
    if (!file) return;
    if (settings.certificates.length >= 30) { setError('You can add up to 30 certificates.'); return; }
    const uploaded = await uploadFile(file, 'certificate');
    if (!uploaded) return;
    const name = uploaded.fileName.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim() || 'Certificate';
    const certificate: WebsiteCertificate = { id: crypto.randomUUID(), name, fileName: uploaded.fileName, fileUrl: uploaded.url };
    update('certificates', [...settings.certificates, certificate]);
  };

  const completedSections = useMemo(() => [
    Boolean(settings.siteName && settings.tagline),
    Boolean(settings.supportEmail || settings.contactPhone || settings.whatsappNumber),
    Boolean(settings.aboutText),
    Boolean(settings.privacyPolicy),
    Boolean(settings.logoUrl || settings.heroImageUrl),
    Boolean(settings.facebookUrl || settings.instagramUrl || settings.tiktokUrl || settings.youtubeUrl || settings.linkedInUrl),
  ].filter(Boolean).length, [settings]);

  const title = TABS.find((tab) => tab.id === activeTab)?.label || 'Website Info Manage';

  return <div className="mx-auto max-w-7xl space-y-5 pb-10">
    <header className="relative overflow-hidden rounded-3xl bg-[#14263d] px-5 py-6 text-white shadow-lg sm:px-8 sm:py-8">
      <div className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full border border-white/10" /><div className="pointer-events-none absolute -right-5 -top-14 h-48 w-48 rounded-full border border-white/10" />
      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div><div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.18em] text-[#e8d1a8]"><Globe className="h-3.5 w-3.5" /> Website control center</div><h1 className="font-serif text-3xl font-medium tracking-tight sm:text-4xl">Website Info Manage</h1><p className="mt-2 max-w-2xl text-xs leading-5 text-white/65">Manage the public identity, contact information, About Us, Privacy Policy, media, and help content for your website.</p></div>
        <div className="flex flex-wrap gap-2"><a href="/" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-3.5 py-2.5 text-xs font-semibold text-white transition hover:bg-white/15"><ExternalLink className="h-3.5 w-3.5" />Open website</a><button type="button" onClick={() => void save()} disabled={saving || loading || Boolean(uploadingField)} className="inline-flex items-center gap-2 rounded-xl bg-[#e4c892] px-4 py-2.5 text-xs font-bold text-[#14263d] transition hover:bg-[#f0d9aa] disabled:cursor-not-allowed disabled:opacity-60">{saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}{saving ? 'Publishing…' : 'Save & publish'}</button></div>
      </div>
    </header>

    {error && <div role="alert" className="flex items-start justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-800"><span>{error}</span><button type="button" onClick={() => void loadSettings()} className="shrink-0 font-semibold underline">Retry</button></div>}
    {success && <div role="status" className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-800"><CheckCircle2 className="h-4 w-4 shrink-0" />{success}</div>}

    <div className="grid gap-5 lg:grid-cols-[245px_minmax(0,1fr)]">
      <nav aria-label="Website information sections" className="flex gap-2 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-sm lg:block lg:space-y-1 lg:overflow-visible lg:self-start">
        {TABS.map((tab) => { const Icon = tab.icon; const active = tab.id === activeTab; return <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)} className={`flex min-w-max items-center gap-3 rounded-xl px-3 py-2.5 text-left transition lg:w-full ${active ? 'bg-[#14263d] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}><span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${active ? 'bg-white/10 text-[#e7cb93]' : 'bg-slate-100 text-slate-500'}`}><Icon className="h-4 w-4" /></span><span className="min-w-0"><span className="block text-xs font-semibold">{tab.label}</span><span className={`hidden text-[10px] lg:block ${active ? 'text-white/55' : 'text-slate-400'}`}>{tab.detail}</span></span></button>; })}
      </nav>

      <div className="min-w-0 space-y-4">
        <div className="flex items-center justify-between gap-3 px-1"><div><p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#a77e43]">Website content</p><h2 className="mt-1 font-serif text-2xl text-[#14263d]">{title}</h2></div>{loading && <span className="inline-flex items-center gap-2 text-[10px] text-slate-500"><LoaderCircle className="h-3.5 w-3.5 animate-spin" />Loading settings</span>}</div>

        {activeTab === 'overview' && <>
          <section className="grid gap-3 sm:grid-cols-3">{[
            { label: 'Content areas ready', value: `${completedSections} of 6`, icon: CheckCircle2 },
            { label: 'Certificates', value: String(settings.certificates.length), icon: FileBadge },
            { label: 'FAQ entries', value: String(settings.faqs.length), icon: MessageCircle },
          ].map((item) => { const Icon = item.icon; return <article key={item.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex items-center justify-between"><span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{item.label}</span><Icon className="h-4 w-4 text-[#a77e43]" /></div><p className="mt-3 text-2xl font-bold tracking-tight text-[#14263d]">{item.value}</p></article>; })}</section>
          <SectionCard title="Website preview" description="Review the public pages that these settings can update." icon={Globe2}>
            <div className="grid gap-3 sm:grid-cols-2">{[
              { label: 'Main website', href: '/', description: 'Header, footer, announcement, and homepage banner' },
              { label: 'About Us', href: '/about', description: 'Company story, certifications, and policies overview' },
              { label: 'Contact & FAQs', href: '/contact', description: 'Support channels, hours, location, and FAQs' },
              { label: 'Privacy Policy', href: '/privacy', description: 'The public privacy information page' },
            ].map((link) => <a key={link.href} href={link.href} target="_blank" rel="noreferrer" className="group flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-3.5 transition hover:border-[#c8ad7e] hover:bg-[#fcfaf5]"><span><span className="block text-xs font-semibold text-slate-800">{link.label}</span><span className="mt-1 block text-[10px] leading-4 text-slate-500">{link.description}</span></span><ArrowUpRight className="h-4 w-4 shrink-0 text-slate-400 group-hover:text-[#a77e43]" /></a>)}</div>
          </SectionCard>
          <SectionCard title="Quick start" description="Add your public contact details and publish your About Us and Privacy Policy before launch." icon={Clock3}>
            <div className="grid gap-2 sm:grid-cols-2">{TABS.slice(1).map((tab) => <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)} className="flex items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium text-slate-700 transition hover:bg-slate-50"><CheckCircle2 className={`h-4 w-4 ${tab.id === 'contact' && (settings.supportEmail || settings.contactPhone) || tab.id === 'about' && settings.aboutText || tab.id === 'policies' && settings.privacyPolicy ? 'text-emerald-600' : 'text-slate-300'}`} />{tab.label}</button>)}</div>
          </SectionCard>
        </>}

        {activeTab === 'identity' && <>
          <SectionCard title="Website identity" description="Control the name and short brand messages visitors see across your website." icon={Building2}>
            <div className="grid gap-4 sm:grid-cols-2"><Field label="Website name"><input className={inputClass} maxLength={120} value={settings.siteName} onChange={(event) => update('siteName', event.target.value)} placeholder="Your website name" /></Field><Field label="Tagline" hint="A short line shown with your brand in the header and footer."><input className={inputClass} maxLength={220} value={settings.tagline} onChange={(event) => update('tagline', event.target.value)} placeholder="A thoughtful edit" /></Field></div>
          </SectionCard>
          <SectionCard title="Brand colors" description="Choose the main and accent colors used for website highlights and branded areas." icon={Palette}>
            <div className="grid gap-4 sm:grid-cols-2">{([{ key: 'primaryColor', label: 'Primary color' }, { key: 'accentColor', label: 'Accent color' }] as const).map((color) => <Field key={color.key} label={color.label}><div className="flex items-center gap-3 rounded-xl border border-slate-200 p-2"><input type="color" value={settings[color.key]} onChange={(event) => update(color.key, event.target.value)} className="h-10 w-12 cursor-pointer rounded-lg border-0 bg-transparent p-0.5" /><input className={`${inputClass} font-mono uppercase`} maxLength={7} value={settings[color.key]} onChange={(event) => update(color.key, event.target.value)} /></div></Field>)}</div>
          </SectionCard>
          <SectionCard title="Logo & browser icon" description="Upload your main logo and favicon. Secure HTTPS image links are supported too." icon={ImageIcon}>
            <div className="space-y-3"><WebsiteMediaField label="Website logo" value={settings.logoUrl} uploading={uploadingField === 'logoUrl'} onChange={(value) => update('logoUrl', value)} onUpload={async (file) => { const uploaded = await uploadFile(file, 'logoUrl'); if (uploaded) update('logoUrl', uploaded.url); }} /><WebsiteMediaField label="Favicon" value={settings.faviconUrl} uploading={uploadingField === 'faviconUrl'} onChange={(value) => update('faviconUrl', value)} onUpload={async (file) => { const uploaded = await uploadFile(file, 'faviconUrl'); if (uploaded) update('faviconUrl', uploaded.url); }} fileHint="Square PNG, GIF, WebP, or ICO · up to 8 MB" /></div>
          </SectionCard>
          <SectionCard title="Announcement bar" description="A short site-wide message displayed above the main navigation." icon={Send}><Field label="Announcement message"><input className={inputClass} maxLength={300} value={settings.announcement} onChange={(event) => update('announcement', event.target.value)} placeholder="A short message for website visitors" /></Field></SectionCard>
        </>}

        {activeTab === 'contact' && <>
          <SectionCard title="Support channels" description="These details appear on the public Contact page and footer." icon={MessageCircle}>
            <div className="grid gap-4 sm:grid-cols-2"><Field label="Support email"><input type="email" className={inputClass} maxLength={255} value={settings.supportEmail} onChange={(event) => update('supportEmail', event.target.value)} placeholder="help@example.com" /></Field><Field label="Contact phone"><input type="tel" className={inputClass} maxLength={80} value={settings.contactPhone} onChange={(event) => update('contactPhone', event.target.value)} placeholder="+1 555 000 0000" /></Field><Field label="WhatsApp number" hint="Enter a number visitors can use to start a WhatsApp chat."><input type="tel" className={inputClass} maxLength={80} value={settings.whatsappNumber} onChange={(event) => update('whatsappNumber', event.target.value)} placeholder="+1 555 000 0000" /></Field><Field label="Opening hours"><input className={inputClass} maxLength={500} value={settings.openingHours} onChange={(event) => update('openingHours', event.target.value)} placeholder="Monday–Friday, 9:00 AM–5:00 PM" /></Field></div>
          </SectionCard>
          <SectionCard title="Business location" description="Add an address visitors can read or a map link they can open." icon={MapPin}>
            <div className="space-y-4"><Field label="Business address"><textarea className={`${inputClass} min-h-24 resize-y`} maxLength={1000} value={settings.contactAddress} onChange={(event) => update('contactAddress', event.target.value)} placeholder="Street, city, region, postal code, country" /></Field><Field label="Map link" hint="Use a secure Google Maps or other map URL."><input type="url" className={inputClass} maxLength={1000} value={settings.mapUrl} onChange={(event) => update('mapUrl', event.target.value)} placeholder="https://maps.google.com/..." /></Field></div>
          </SectionCard>
        </>}

        {activeTab === 'about' && <>
          <SectionCard title="About Us page" description="Share your organization’s story and the values visitors should know." icon={AlignLeft}>
            <div className="space-y-4"><Field label="Page heading"><input className={inputClass} maxLength={240} value={settings.aboutHeadline} onChange={(event) => update('aboutHeadline', event.target.value)} placeholder="What should visitors know about you?" /></Field><Field label="About Us content" hint="Use plain text. Line breaks are preserved on the public page."><textarea className={`${inputClass} min-h-64 resize-y leading-6`} maxLength={12000} value={settings.aboutText} onChange={(event) => update('aboutText', event.target.value)} placeholder="Write your organization’s story, purpose, and the people behind it." /></Field><span className="block text-right text-[10px] text-slate-400">{settings.aboutText.length} / 12,000</span></div>
          </SectionCard>
          <SectionCard title="Company & registration details" description="Optional organization information to show on your About Us page." icon={BadgeCheck}>
            <div className="grid gap-4 sm:grid-cols-2"><Field label="Legal company name"><input className={inputClass} maxLength={255} value={settings.legalCompanyName} onChange={(event) => update('legalCompanyName', event.target.value)} placeholder="Registered company name" /></Field><Field label="Country or jurisdiction"><input className={inputClass} maxLength={255} value={settings.jurisdiction} onChange={(event) => update('jurisdiction', event.target.value)} placeholder="Country or region" /></Field><Field label="Registration number"><input className={inputClass} maxLength={120} value={settings.companyRegNumber} onChange={(event) => update('companyRegNumber', event.target.value)} placeholder="Optional registration reference" /></Field><Field label="Registered address"><textarea className={`${inputClass} min-h-20 resize-y`} maxLength={1200} value={settings.registeredAddress} onChange={(event) => update('registeredAddress', event.target.value)} placeholder="Registered office address" /></Field></div>
          </SectionCard>
        </>}

        {activeTab === 'media' && <>
          <SectionCard title="Homepage banner" description="Update the welcome badge, main heading, supporting text, and hero image." icon={ImageIcon}>
            <div className="space-y-4"><div className="grid gap-4 sm:grid-cols-2"><Field label="Welcome badge"><input className={inputClass} maxLength={120} value={settings.heroBadge} onChange={(event) => update('heroBadge', event.target.value)} placeholder="A short welcome line" /></Field><Field label="Banner heading"><input className={inputClass} maxLength={240} value={settings.heroTitle} onChange={(event) => update('heroTitle', event.target.value)} placeholder="Your main website heading" /></Field></div><Field label="Banner description"><textarea className={`${inputClass} min-h-24 resize-y`} maxLength={1200} value={settings.heroSubtitle} onChange={(event) => update('heroSubtitle', event.target.value)} placeholder="A short introduction for the homepage" /></Field><WebsiteMediaField label="Homepage banner image" value={settings.heroImageUrl} uploading={uploadingField === 'heroImageUrl'} onChange={(value) => update('heroImageUrl', value)} onUpload={async (file) => { const uploaded = await uploadFile(file, 'heroImageUrl'); if (uploaded) update('heroImageUrl', uploaded.url); }} /></div>
          </SectionCard>
          <SectionCard title="About Us image" description="A supporting photo for the public About Us page." icon={ImageIcon}><WebsiteMediaField label="About Us image" value={settings.aboutImageUrl} uploading={uploadingField === 'aboutImageUrl'} onChange={(value) => update('aboutImageUrl', value)} onUpload={async (file) => { const uploaded = await uploadFile(file, 'aboutImageUrl'); if (uploaded) update('aboutImageUrl', uploaded.url); }} /></SectionCard>
          <SectionCard title="Certificates & credentials" description="Upload certificates or other organization credentials to display on your About Us page." icon={FileBadge}>
            <div className="space-y-3">{settings.certificates.map((certificate) => <article key={certificate.id} className="flex flex-col gap-3 rounded-xl border border-slate-200 p-3 sm:flex-row sm:items-center"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#f6f2e9] text-[#987444]"><FileText className="h-4 w-4" /></span><div className="min-w-0 flex-1"><input className={inputClass} maxLength={160} value={certificate.name} onChange={(event) => update('certificates', settings.certificates.map((entry) => entry.id === certificate.id ? { ...entry, name: event.target.value } : entry))} aria-label="Certificate title" /><a href={certificate.fileUrl} target="_blank" rel="noreferrer" className="mt-1 inline-flex max-w-full items-center gap-1 truncate text-[10px] text-blue-700 hover:underline"><ExternalLink className="h-3 w-3 shrink-0" />{certificate.fileName}</a></div><button type="button" onClick={() => update('certificates', settings.certificates.filter((entry) => entry.id !== certificate.id))} aria-label={`Remove ${certificate.name}`} className="rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"><Trash2 className="h-4 w-4" /></button></article>)}
              <label className="flex min-h-24 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-center transition hover:border-[#b99152] hover:bg-[#fcfaf5]">{uploadingField === 'certificate' ? <LoaderCircle className="h-5 w-5 animate-spin text-slate-500" /> : <Upload className="h-5 w-5 text-slate-500" />}<span className="mt-2 text-xs font-semibold text-slate-700">{uploadingField === 'certificate' ? 'Uploading certificate…' : 'Add a certificate or credential'}</span><span className="mt-1 text-[10px] text-slate-500">JPG, PNG, WebP, GIF, ICO, or PDF · up to 8 MB</span><input type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/x-icon,application/pdf" disabled={uploadingField === 'certificate'} className="sr-only" onChange={(event) => { void addCertificate(event.target.files?.[0]); event.target.value = ''; }} /></label>
            </div>
          </SectionCard>
        </>}

        {activeTab === 'policies' && <>
          <SectionCard title="Privacy Policy" description="Write the privacy information visitors can review from the website footer." icon={ShieldCheck}><Field label="Privacy Policy content" hint="Use clear language and line breaks. The public page will show this text as written."><textarea className={`${inputClass} min-h-72 resize-y leading-6`} maxLength={25000} value={settings.privacyPolicy} onChange={(event) => update('privacyPolicy', event.target.value)} placeholder="Explain what information you collect, why you use it, how it is stored, and how visitors can contact you about privacy." /></Field><p className="mt-2 text-right text-[10px] text-slate-400">{settings.privacyPolicy.length} / 25,000</p></SectionCard>
          <SectionCard title="Terms, shipping & returns" description="Manage the website's terms and customer-facing service policies." icon={FileText}>
            <div className="space-y-4"><Field label="Website terms"><textarea className={`${inputClass} min-h-36 resize-y leading-6`} maxLength={25000} value={settings.termsText} onChange={(event) => update('termsText', event.target.value)} placeholder="Add your terms of use and general service conditions." /></Field><div className="grid gap-4 sm:grid-cols-2"><Field label="Shipping information"><textarea className={`${inputClass} min-h-32 resize-y leading-6`} maxLength={12000} value={settings.shippingText} onChange={(event) => update('shippingText', event.target.value)} placeholder="Add delivery areas, times, and general shipping details." /></Field><Field label="Returns & refunds"><textarea className={`${inputClass} min-h-32 resize-y leading-6`} maxLength={12000} value={settings.returnsText} onChange={(event) => update('returnsText', event.target.value)} placeholder="Add your general return and refund information." /></Field></div></div>
          </SectionCard>
          <SectionCard title="Frequently asked questions" description="Create general help answers for the public Contact page." icon={MessageCircle}>
            <div className="space-y-3">{settings.faqs.map((faq, index) => <article key={faq.id} className="rounded-xl border border-slate-200 p-4"><div className="mb-3 flex items-center justify-between"><p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Question {index + 1}</p><button type="button" onClick={() => update('faqs', settings.faqs.filter((entry) => entry.id !== faq.id))} aria-label={`Remove question ${index + 1}`} className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600"><Trash2 className="h-4 w-4" /></button></div><div className="space-y-3"><Field label="Question"><input className={inputClass} maxLength={300} value={faq.question} onChange={(event) => update('faqs', settings.faqs.map((entry) => entry.id === faq.id ? { ...entry, question: event.target.value } : entry))} placeholder="What do visitors ask?" /></Field><Field label="Answer"><textarea className={`${inputClass} min-h-24 resize-y leading-6`} maxLength={3000} value={faq.answer} onChange={(event) => update('faqs', settings.faqs.map((entry) => entry.id === faq.id ? { ...entry, answer: event.target.value } : entry))} placeholder="Write a clear answer." /></Field></div></article>)}<button type="button" onClick={addFaq} disabled={settings.faqs.length >= 30} className="inline-flex items-center gap-2 rounded-xl border border-dashed border-slate-300 px-4 py-3 text-xs font-semibold text-slate-700 hover:border-[#b99152] hover:bg-[#fcfaf5] disabled:opacity-50"><Plus className="h-4 w-4" />Add FAQ</button></div>
          </SectionCard>
        </>}

        {activeTab === 'social-seo' && <>
          <SectionCard title="Social media links" description="Add the official social pages to display in the website footer." icon={Instagram}>
            <div className="grid gap-4 sm:grid-cols-2">{([{ key: 'facebookUrl', label: 'Facebook' }, { key: 'instagramUrl', label: 'Instagram' }, { key: 'tiktokUrl', label: 'TikTok' }, { key: 'youtubeUrl', label: 'YouTube' }, { key: 'linkedInUrl', label: 'LinkedIn' }] as const).map((social) => <Field key={social.key} label={social.label}><input type="url" className={inputClass} maxLength={1000} value={settings[social.key]} onChange={(event) => update(social.key, event.target.value)} placeholder="https://..." /></Field>)}</div>
          </SectionCard>
          <SectionCard title="Search preview" description="These details help search engines and social platforms describe your website." icon={Search}>
            <div className="space-y-4"><Field label="Search result title"><input className={inputClass} maxLength={240} value={settings.seoTitle} onChange={(event) => update('seoTitle', event.target.value)} placeholder={`${settings.siteName} — ${settings.tagline}`} /></Field><Field label="Search description"><textarea className={`${inputClass} min-h-24 resize-y`} maxLength={500} value={settings.seoDescription} onChange={(event) => update('seoDescription', event.target.value)} placeholder="A concise description of your website." /></Field><WebsiteMediaField label="Social sharing image" value={settings.socialImageUrl} uploading={uploadingField === 'socialImageUrl'} onChange={(value) => update('socialImageUrl', value)} onUpload={async (file) => { const uploaded = await uploadFile(file, 'socialImageUrl'); if (uploaded) update('socialImageUrl', uploaded.url); }} fileHint="A wide image used when sharing your website · up to 8 MB" /></div>
          </SectionCard>
        </>}

        {activeTab !== 'overview' && <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm"><div className="flex items-center gap-2 text-[11px] text-slate-500"><CheckCircle2 className="h-4 w-4 text-emerald-600" />Changes are drafts until you save and publish.</div><button type="button" onClick={() => void save()} disabled={saving || loading || Boolean(uploadingField)} className="inline-flex items-center gap-2 rounded-xl bg-[#14263d] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#203a5b] disabled:opacity-50">{saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}{saving ? 'Publishing…' : 'Save & publish'}</button></div>}
      </div>
    </div>
  </div>;
}
