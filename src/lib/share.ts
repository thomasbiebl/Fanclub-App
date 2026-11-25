import { fmtDate, fmtPrice } from '../components/ui';
import type { Trip } from '../domain/types';

export interface ShareData { title: string; text: string; url: string }

/** Address of the app without query (e.g. ?demo), so the link opens the real app. */
export const appUrl = () => `${location.origin}${location.pathname}`;

export function tripShareData(trip: Trip, base: string): ShareData {
  return {
    title: `Busfahrt ${trip.title}`,
    text: `Busfahrt ${trip.title} · ${fmtDate(trip.departure)} · ${fmtPrice(trip.price)}`,
    url: `${base}#/trip/${trip.id}`,
  };
}

/** Opens the phone's share menu, or copies the link where there is none. */
export async function share(data: ShareData): Promise<'shared' | 'copied' | 'cancelled' | 'failed'> {
  if (navigator.share) {
    try {
      await navigator.share(data);
      return 'shared';
    } catch (e) {
      if ((e as Error).name === 'AbortError') return 'cancelled';
    }
  }
  try {
    await navigator.clipboard.writeText(`${data.text}\n${data.url}`);
    return 'copied';
  } catch {
    return 'failed';
  }
}
