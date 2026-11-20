'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import AnnouncementBar from '@/components/layout/AnnouncementBar';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Toast from '@/components/common/Toast';
import { CompareTray } from '@/components/compare/CompareTray';
import { WhatsAppShortcut } from '@/components/layout/WhatsAppShortcut';
import { StorefrontCatalogProvider } from '@/context/StorefrontCatalogContext';
import { withStorefrontCompanyInfo } from '@/lib/storefrontCompany';
import type { WebsiteInfo } from '@/lib/websiteInfo';

export default function AppShell({ children, initialWebsiteInfo }: { children: React.ReactNode; initialWebsiteInfo: WebsiteInfo }) {
  const pathname = usePathname();
  const isPortal = pathname?.startsWith('/seller') || pathname?.startsWith('/admin');
  const [websiteInfo, setWebsiteInfo] = useState(initialWebsiteInfo);

  useEffect(() => {
    setWebsiteInfo(initialWebsiteInfo);
  }, [initialWebsiteInfo]);

  useEffect(() => {
    if (isPortal) return;
    let active = true;
    const refreshWebsiteInfo = async () => {
      try {
        const response = await fetch('/api/website-info', { cache: 'no-store' });
        const result = await response.json();
        if (active && response.ok && result.success) {
          setWebsiteInfo(withStorefrontCompanyInfo({ ...initialWebsiteInfo, ...result.settings }));
        }
      } catch { /* Keep the server-provided settings if a refresh is unavailable. */ }
    };
    const refresh = () => { void refreshWebsiteInfo(); };
    window.addEventListener('focus', refresh);
    window.addEventListener('galleria:website-info-changed', refresh);
    return () => {
      active = false;
      window.removeEventListener('focus', refresh);
      window.removeEventListener('galleria:website-info-changed', refresh);
    };
  }, [initialWebsiteInfo, isPortal]);

  if (isPortal) {
    return (
      <main className="min-h-screen">
        {children}
        <Toast />
      </main>
    );
  }

  return (
    <StorefrontCatalogProvider>
      <AnnouncementBar websiteInfo={websiteInfo} />
      <Navbar websiteInfo={websiteInfo} />
      <main className="flex-1">{children}</main>
      <Footer websiteInfo={websiteInfo} />
      <WhatsAppShortcut number={websiteInfo.whatsappNumber} />
      <CompareTray />
      <Toast />
    </StorefrontCatalogProvider>
  );
}
