import { cache } from 'react';
import { DEFAULT_WEBSITE_INFO } from '@/lib/websiteInfo';
import { getWebsiteInfo } from '@/lib/websiteInfoServer';
import { withStorefrontCompanyInfo } from '@/lib/storefrontCompany';

export const getStorefrontWebsiteInfo = cache(async () => {
  try {
    return withStorefrontCompanyInfo(await getWebsiteInfo());
  } catch {
    return withStorefrontCompanyInfo(DEFAULT_WEBSITE_INFO);
  }
});
