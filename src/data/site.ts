import { hosting } from '../../site.config.mjs';

export const site = {
  name: 'Procrastination Timer',
  origin: hosting.origin,
  base: hosting.base,
  email: 'ozawatomu@gmail.com',
  author: 'Tomu Ozawa',
  version: '3.0.0',
  description:
    'Free two-stopwatch app for Android and iPhone. Tap Studying or Procrastinating and see exactly how your time splits. Keeps counting in the background. No ads, no accounts, no tracking.',
  android: {
    available: false,
    url: 'https://play.google.com/store/apps/details?id=com.tomuozawa.procrastinationtimer',
  },
  ios: {
    available: false,
    url: null as string | null,
  },
} as const;

export const anyStoreAvailable = site.android.available || site.ios.available;

const trimmedBase = import.meta.env.BASE_URL.replace(/\/$/, '');

export const href = (path: string): string => `${trimmedBase}${path}`;

export const absolute = (path: string): string => `${site.origin}${href(path)}`;

export function playUrl(campaign: string): string {
  const url = new URL(site.android.url);
  url.searchParams.set(
    'referrer',
    new URLSearchParams({
      utm_source: new URL(site.origin).hostname,
      utm_medium: 'website',
      utm_campaign: `website_${campaign}`,
    }).toString(),
  );
  return url.toString();
}
