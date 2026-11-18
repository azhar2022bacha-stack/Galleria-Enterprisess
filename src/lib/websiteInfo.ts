export interface WebsiteCertificate {
  id: string;
  name: string;
  fileUrl: string;
  fileName: string;
}

export interface WebsiteFaq {
  id: string;
  question: string;
  answer: string;
}

export interface WebsiteInfo {
  siteName: string;
  tagline: string;
  announcement: string;
  logoUrl: string;
  faviconUrl: string;
  primaryColor: string;
  accentColor: string;
  supportEmail: string;
  contactPhone: string;
  whatsappNumber: string;
  contactAddress: string;
  openingHours: string;
  mapUrl: string;
  legalCompanyName: string;
  jurisdiction: string;
  companyRegNumber: string;
  registeredAddress: string;
  aboutHeadline: string;
  aboutText: string;
  aboutImageUrl: string;
  certificates: WebsiteCertificate[];
  heroBadge: string;
  heroTitle: string;
  heroSubtitle: string;
  heroImageUrl: string;
  facebookUrl: string;
  instagramUrl: string;
  tiktokUrl: string;
  youtubeUrl: string;
  linkedInUrl: string;
  privacyPolicy: string;
  termsText: string;
  shippingText: string;
  returnsText: string;
  faqs: WebsiteFaq[];
  seoTitle: string;
  seoDescription: string;
  socialImageUrl: string;
}

export const DEFAULT_WEBSITE_INFO: WebsiteInfo = {
  siteName: 'Galleria',
  tagline: 'A thoughtful edit',
  announcement: 'A thoughtful place for good finds.',
  logoUrl: '',
  faviconUrl: '',
  primaryColor: '#14263d',
  accentColor: '#a77e43',
  supportEmail: '',
  contactPhone: '',
  whatsappNumber: '',
  contactAddress: '',
  openingHours: '',
  mapUrl: '',
  legalCompanyName: '',
  jurisdiction: '',
  companyRegNumber: '',
  registeredAddress: '',
  aboutHeadline: 'A marketplace taking shape.',
  aboutText: '',
  aboutImageUrl: '',
  certificates: [],
  heroBadge: 'Welcome',
  heroTitle: 'Discover more. Shop with confidence.',
  heroSubtitle: 'Share what makes your website special with visitors.',
  heroImageUrl: '',
  facebookUrl: '',
  instagramUrl: '',
  tiktokUrl: '',
  youtubeUrl: '',
  linkedInUrl: '',
  privacyPolicy: '',
  termsText: '',
  shippingText: '',
  returnsText: '',
  faqs: [],
  seoTitle: '',
  seoDescription: '',
  socialImageUrl: '',
};
