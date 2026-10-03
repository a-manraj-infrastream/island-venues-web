import type { Booking, Venue } from '@/api';

export const venues: Venue[] = [
  {
    id: 'v-le-morne',
    name: 'Le Morne Beach Pavilion',
    town: 'Le Morne',
    capacity: 120,
    pricePerDayMur: 85000,
    description: 'Open-air pavilion at the foot of Le Morne Brabant.',
    tags: ['beach', 'sunset'],
  },
  {
    id: 'v-curepipe',
    name: 'Curepipe Colonial House',
    town: 'Curepipe',
    capacity: 40,
    pricePerDayMur: 32000,
    description: 'Restored colonial house with a covered veranda.',
    tags: ['heritage'],
  },
];

export function booking(overrides: Partial<Booking> = {}): Booking {
  return {
    id: 'b-1',
    venueId: 'v-le-morne',
    venueName: 'Le Morne Beach Pavilion',
    date: '2099-12-31',
    guests: 80,
    owner: 'guest@example.com',
    contactEmail: 'guest@example.com',
    status: 'PENDING',
    createdAt: '2026-10-03T06:00:00Z',
    ...overrides,
  };
}
