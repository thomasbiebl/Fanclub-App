import { pastTripCount, takenTrips } from './rules';
import type { Booking, Trip, User } from './types';

/** Trip counts that earn a badge. */
export const BADGES = [10, 25, 50, 100] as const;

/** Football season from 1 July to 30 June, e.g. "2026/27". */
export function seasonOf(iso: string): string {
  const d = new Date(iso);
  const start = d.getMonth() >= 6 ? d.getFullYear() : d.getFullYear() - 1;
  return `${start}/${String((start + 1) % 100).padStart(2, '0')}`;
}

export interface TripStats {
  /** All trips, including those from before the app (start value set by admins). */
  total: number;
  /** Season that is running now. */
  season: string;
  seasonCount: number;
  /** Trips per season taken in the app, newest season first. */
  seasons: { season: string; count: number }[];
  /** Reached badges, smallest first. */
  earned: number[];
  /** Next badge and how many trips are missing, unless all are reached. */
  next?: { at: number; missing: number };
}

export function tripStats(user: User, trips: Trip[], bookings: Booking[], now: number): TripStats {
  const total = pastTripCount(user, trips, bookings, now);
  const perSeason = new Map<string, number>();
  for (const t of takenTrips(user, trips, bookings, now)) perSeason.set(seasonOf(t.departure), (perSeason.get(seasonOf(t.departure)) ?? 0) + 1);
  const season = seasonOf(new Date(now).toISOString());
  const nextAt = BADGES.find((b) => b > total);
  return {
    total,
    season,
    seasonCount: perSeason.get(season) ?? 0,
    seasons: [...perSeason].map(([s, count]) => ({ season: s, count })).sort((a, b) => b.season.localeCompare(a.season)),
    earned: BADGES.filter((b) => b <= total),
    next: nextAt === undefined ? undefined : { at: nextAt, missing: nextAt - total },
  };
}
