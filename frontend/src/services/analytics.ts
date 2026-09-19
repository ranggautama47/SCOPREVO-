type Gtag = (...args: unknown[]) => void;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: Gtag;
  }
}

let initialized = false;
let measurementId: string | null = null;

export function initializeGA(): void {
  if (initialized) return;
  initialized = true;
  const id = import.meta.env.VITE_GA_MEASUREMENT_ID?.trim();
  if (!id) {
    if (import.meta.env.DEV) {
      console.log('[Analytics Dev] VITE_GA_MEASUREMENT_ID not set. GA4 tracking disabled.');
    }
    return;
  }
  measurementId = id;
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function gtag(..._args: unknown[]): void {
    window.dataLayer?.push(arguments);
  };
  window.gtag('js', new Date());
  window.gtag('config', id, (() => {
    const config: Record<string, unknown> = {
      send_page_view: false,
    };
    if (import.meta.env.DEV) {
      config.debug_mode = true;
    }
    return config;
  })());
  if (import.meta.env.DEV) {
    console.log('[Analytics Dev] GA4 initialized with ID:', id);
  }
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
  document.head.appendChild(script);
}

export function trackPageView(path: string): void {
  if (!measurementId || !window.gtag) return;
  const eventData = {
    page_path: path,
    page_location: `${window.location.origin}${path}`,
  };
  window.gtag('event', 'page_view', eventData);
  if (import.meta.env.DEV) {
    console.log('[Analytics Dev] Tracking event: page_view', eventData);
  }
}

export function trackEvent(name: string, params?: Record<string, unknown>): void {
  if (!measurementId || !window.gtag) return;
  if (import.meta.env.DEV) {
    console.log('[Analytics Dev] Tracking event:', name, params || {});
  }
  window.gtag('event', name, params);
}
