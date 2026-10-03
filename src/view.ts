// State-based navigation: the app has three screens, so a discriminated union
// replaces a router library (no extra runtime dependency).
export type View = { name: 'venues' } | { name: 'venue'; id: string } | { name: 'bookings' };
