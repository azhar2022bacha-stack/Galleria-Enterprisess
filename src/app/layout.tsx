import type { Metadata } from 'next';
import './globals.css';
import AppShell from '@/components/layout/AppShell';
import { CartProvider } from '@/context/CartContext';
import { WishlistProvider } from '@/context/WishlistContext';
import { CompareProvider } from '@/context/CompareContext';
import type { CSSProperties } from 'react';
import { cache } from 'react';
import { DEFAULT_WEBSITE_INFO } from '@/lib/websiteInfo';
import { getWebsiteInfo } from '@/lib/websiteInfoServer';

export const dynamic = 'force-dynamic';

const getWebsiteInfoForRequest = cache(async () => {
  try { return await getWebsiteInfo(); } catch { return DEFAULT_WEBSITE_INFO; }
});

export async function generateMetadata(): Promise<Metadata> {
  const websiteInfo = await getWebsiteInfoForRequest();
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
  const websiteInfo = await getWebsiteInfoForRequest();
  const brandVariables = {
    '--website-primary': websiteInfo.primaryColor,
    '--website-accent': websiteInfo.accentColor,
  } as CSSProperties;
  return (
    <html lang="en" style={brandVariables}>
      <body className="min-h-screen flex flex-col bg-[#fbfaf7] text-[#17283e] font-sans">
        <CartProvider>
          <WishlistProvider>
            <CompareProvider>
              <AppShell initialWebsiteInfo={websiteInfo}>{children}</AppShell>
            </CompareProvider>
          </WishlistProvider>
        </CartProvider>
      </body>
    </html>
  );
}
