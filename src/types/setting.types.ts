export interface Setting {
  _id: string;
  siteName: string;
  companyName: string;
  logoLight: string;
  logoDark: string;
  siteFavicon: string;

  domain: string;
  subdomain: string[];
  description: string;
  keywords: string[];

  email: string;
  phone: string;
  address: string;

  facebook: string;
  instagram: string;
  twitter: string;
  youtube: string;

  timezone: string;
  language: string;
  currency: string;

  metaTitle: string;
  metaDescription: string;
  ogImage: string;

  googleAnalyticsId: string;
  facebookPixelId: string;

  // Email Configuration (SMTP)
  smtpHost: string;
  smtpPort: number;
  smtpUsername: string;
  smtpPassword: string;
}
