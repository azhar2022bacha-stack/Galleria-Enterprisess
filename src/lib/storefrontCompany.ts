import { DEFAULT_WEBSITE_INFO, type WebsiteInfo } from '@/lib/websiteInfo';

export const storefrontCompany = {
  name: 'Galleria Enterprises',
  legalName: 'Galleria Enterprises, Inc.',
  logoUrl: '/images/storefront/galleria-enterprises-logo.jpeg',
  country: 'United States',
  location: 'Fairfield, New Jersey',
  category: 'Gifts and accessories',
  activity: 'Retail and importing',
  addressLabel: 'Corporate Headquarters & Warehouse',
  address: '24 Commerce Road\nFairfield, New Jersey 07004, USA',
  supportEmail: 'support@galleriaenterprisess.com',
  whatsappNumber: '+1 (916) 530-4924',
  aboutHeadline: 'Gifts and accessories from Fairfield, New Jersey',
  aboutText: 'Galleria Enterprises, Inc. is a gifts and accessories retailer and importer based in Fairfield, New Jersey. Our range includes umbrellas, scarves, bags, and rain boots.',
} as const;

export function withStorefrontCompanyInfo(settings: WebsiteInfo): WebsiteInfo {
  const siteName = settings.siteName.trim();
  const aboutHeadline = settings.aboutHeadline.trim();

  return {
    ...settings,
    siteName: siteName && siteName !== DEFAULT_WEBSITE_INFO.siteName ? siteName : storefrontCompany.name,
    legalCompanyName: settings.legalCompanyName.trim() || storefrontCompany.legalName,
    logoUrl: settings.logoUrl.trim() || storefrontCompany.logoUrl,
    supportEmail: settings.supportEmail.trim() || storefrontCompany.supportEmail,
    whatsappNumber: settings.whatsappNumber.trim() || storefrontCompany.whatsappNumber,
    contactAddress: settings.contactAddress.trim() || storefrontCompany.address,
    aboutHeadline: aboutHeadline && aboutHeadline !== DEFAULT_WEBSITE_INFO.aboutHeadline ? aboutHeadline : storefrontCompany.aboutHeadline,
    aboutText: settings.aboutText.trim() || storefrontCompany.aboutText,
  };
}

export function getWhatsAppHref(number: string): string {
  const digits = number.replace(/\D/g, '');
  return digits ? 'https://wa.me/' + digits : '';
}

export function getStorefrontAddressLabel(address: string): string {
  const normalize = (value: string) => value.replace(/[\s,]+/g, ' ').trim().toLowerCase();
  return normalize(address) === normalize(storefrontCompany.address)
    ? storefrontCompany.addressLabel
    : 'Business address';
}
