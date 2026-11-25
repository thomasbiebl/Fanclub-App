import { describe, expect, it } from 'vitest';
import { tripMessageError, tripMessageRecipients } from '../src/domain/notifications';
import { addWeeks, copyWeeks, departureHint } from '../src/domain/rules';
import { BADGES, seasonOf, tripStats } from '../src/domain/stats';
import type { Booking, Trip, User } from '../src/domain/types';
import { tripShareData } from '../src/lib/share';

const DAY = 86_400_000;
const at = (y: number, m: number, d: number, h = 8, min = 0) => new Date(y, m - 1, d, h, min).getTime();
const trip = (id: string, departure: number, extra: Partial<Trip> = {}): Trip => ({
  id, title: `Fahrt ${id}`, departure: new Date(departure).toISOString(), meetingPoint: 'P', price: 30, seats: 50,
  createdAt: new Date(departure - 30 * DAY).toISOString(), interestEndsAt: new Date(departure - 20 * DAY).toISOString(),
  notes: '', stops: [], buses: 1, points: 1, ...extra,
});
const booking = (tripId: string, userId: string, status: Booking['status'], extra: Partial<Booking> = {}): Booking => ({
  id: `${tripId}-${userId}`, tripId, userId, status, createdAt: '2026-01-01T00:00:00Z', companions: 0, companionNames: '', paid: false, ...extra,
});
const user = (baseTrips = 0): User => ({
  id: 'me', email: 'me@x.de', name: 'Me', passwordHash: '', isMember: true, isAdmin: false, memberRequested: false,
  baseTrips, createdAt: '2020-01-01T00:00:00Z', emailPersonal: true, emailBroadcast: false,
});

describe('departure hint in the trip list', () => {
  const now = at(2026, 11, 25, 10, 0);
  it('says today, tomorrow, in N days or minutes, and nothing once departed', () => {
    expect(departureHint(new Date(at(2026, 11, 25, 10, 20)).toISOString(), now)).toBe('in 20 Min.');
    expect(departureHint(new Date(at(2026, 11, 25, 23, 0)).toISOString(), now)).toBe('heute');
    expect(departureHint(new Date(at(2026, 11, 26, 6, 0)).toISOString(), now)).toBe('morgen');
    expect(departureHint(new Date(at(2026, 11, 30, 6, 0)).toISOString(), now)).toBe('in 5 Tagen');
    expect(departureHint(new Date(at(2026, 11, 25, 9, 0)).toISOString(), now)).toBe('');
  });
});

describe('copying a trip', () => {
  it('keeps weekday and local time, also across a daylight saving change', () => {
    const before = new Date(at(2026, 10, 20, 8, 30)).toISOString(); // summer time
    const after = new Date(addWeeks(before, 2));
    expect([after.getDay(), after.getHours(), after.getMinutes(), after.getDate()]).toEqual([new Date(before).getDay(), 8, 30, 3]);
  });

  it('moves a past trip into the future, at least a day ahead, and a future one by a week', () => {
    const now = at(2026, 11, 25, 10);
    expect(copyWeeks(new Date(at(2026, 11, 28, 8)).toISOString(), now)).toBe(1);
    expect(copyWeeks(new Date(at(2026, 11, 18, 8)).toISOString(), now)).toBe(2); // +1 week would be tomorrow 8:00, less than a day
    expect(copyWeeks(new Date(at(2026, 9, 1, 8)).toISOString(), now)).toBe(13);
    const weeks = copyWeeks(new Date(at(2026, 9, 1, 8)).toISOString(), now);
    expect(Date.parse(addWeeks(new Date(at(2026, 9, 1, 8)).toISOString(), weeks))).toBeGreaterThan(now + DAY);
  });
});

describe('personal statistics', () => {
  it('splits trips into seasons from July to June', () => {
    expect(seasonOf(new Date(at(2026, 6, 30)).toISOString())).toBe('2025/26');
    expect(seasonOf(new Date(at(2026, 7, 1)).toISOString())).toBe('2026/27');
    expect(seasonOf(new Date(at(2099, 12, 1)).toISOString())).toBe('2099/00');
  });

  it('counts taken trips per season, skips no-shows and cancelled trips, and shows the next badge', () => {
    const now = at(2026, 11, 25);
    const trips = [
      trip('a', at(2025, 9, 1)), trip('b', at(2026, 3, 1)), trip('c', at(2026, 8, 15)), trip('d', at(2026, 10, 1)),
      trip('e', at(2026, 10, 15)), trip('f', at(2026, 11, 1), { cancelledAt: '2026-10-30T00:00:00Z' }), trip('g', at(2026, 12, 20)),
    ];
    const bookings = [
      booking('a', 'me', 'confirmed'), booking('b', 'me', 'confirmed'), booking('c', 'me', 'confirmed'), booking('d', 'me', 'confirmed'),
      booking('e', 'me', 'confirmed', { attended: false }), booking('f', 'me', 'confirmed'), booking('g', 'me', 'confirmed'),
      booking('c', 'other', 'confirmed'),
    ];
    const stats = tripStats(user(6), trips, bookings, now);
    expect(stats).toEqual({
      total: 10, season: '2026/27', seasonCount: 2,
      seasons: [{ season: '2026/27', count: 2 }, { season: '2025/26', count: 2 }],
      earned: [10], next: { at: 25, missing: 15 },
    });
    expect(tripStats(user(100), [], [], now).next).toBeUndefined();
    expect(tripStats(user(100), [], [], now).earned).toEqual([...BADGES]);
  });
});

describe('message to passengers', () => {
  const bookings = [booking('t', 'a', 'confirmed'), booking('t', 'b', 'waitlist'), booking('t', 'c', 'interested'), booking('x', 'd', 'confirmed')];
  it('goes to confirmed seats, or to everyone with a booking on request', () => {
    expect(tripMessageRecipients(bookings, 't', false)).toEqual(['a']);
    expect(tripMessageRecipients(bookings, 't', true)).toEqual(['a', 'b', 'c']);
  });
  it('must not be empty or longer than 1000 characters', () => {
    expect(tripMessageError('  ')).toMatch(/eingeben/);
    expect(tripMessageError('x'.repeat(1001))).toMatch(/zu lang/);
    expect(tripMessageError(` ${'x'.repeat(1000)} `)).toBeNull();
  });
});

describe('sharing a trip', () => {
  it('links to the trip in the app and names date and price', () => {
    const data = tripShareData(trip('t1', at(2026, 12, 6, 6, 45), { title: 'Augsburg (A)', price: 28 }), 'https://www.example.org/Fanclub-App/');
    expect(data.url).toBe('https://www.example.org/Fanclub-App/#/trip/t1');
    expect(data.title).toBe('Busfahrt Augsburg (A)');
    expect(data.text).toMatch(/^Busfahrt Augsburg \(A\) · .*06\.12\..*06:45 Uhr · 28\s€$/);
  });
});
