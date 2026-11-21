import type { Metadata } from 'next';
import './globals.css';
import AppShell from '@/components/layout/AppShell';
import type { CSSProperties } from 'react';
import { getStorefrontWebsiteInfo } from '@/lib/getStorefrontWebsiteInfo';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const websiteInfo = await getStorefrontWebsiteInfo();
  const title = websiteInfo.seoTitle || `${websiteInfo.siteName} — ${websiteInfo.tagline}`;
  const description = websiteInfo.seoDescription || websiteInfo.tagline;
  return {
    title,
    description,
    applicationName: websiteInfo.siteName,
    icons: { icon: websiteInfo.faviconUrl || '/favicon.ico' },
    openGraph: { title, description, images: websiteInfo.socialImageUrl ? [websiteInfo.socialImageUrl] : undefined },
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const websiteInfo = await getStorefrontWebsiteInfo();
  const brandVariables = {
    '--website-primary': websiteInfo.primaryColor,
    '--website-accent': websiteInfo.accentColor,
  } as CSSProperties;
  return (
    <html lang="en" style={brandVariables}>
      <body className="min-h-screen flex flex-col bg-[#fbfaf7] text-[#17283e] font-sans">
        <AppShell initialWebsiteInfo={websiteInfo}>{children}</AppShell>
      </body>
    </html>
  );
}
