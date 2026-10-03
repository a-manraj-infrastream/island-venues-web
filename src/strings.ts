// Every user-visible string lives here. The app is English-only for now; this
// single module is the seam where an i18n library (t() lookups) can be added
// later without touching component logic.

import type { BookingStatus } from '@/api';

export const strings = {
  appName: 'Island Venues',
  tagline: 'Event venues across Mauritius',
  skipToContent: 'Skip to content',
  nav: {
    label: 'Main',
    venues: 'Venues',
    myBookings: 'My bookings',
  },
  venues: {
    heading: 'Find a venue',
    intro: 'Beach pavilions, colonial houses and garden terraces, from Port Louis to Blue Bay.',
    loading: 'Loading venues…',
    empty: 'No venues are available right now.',
    town: 'Town',
    capacity: 'Capacity',
    pricePerDay: 'Price per day',
    guests: (n: number) => `${n} guests`,
    viewAndBook: (name: string) => `View and book ${name}`,
    viewAndBookShort: 'View & book',
  },
  venue: {
    loading: 'Loading venue…',
    notFound: 'This venue does not exist or is no longer listed.',
    back: 'Back to venues',
    tags: 'Features',
  },
  booking: {
    heading: 'Request a booking',
    date: 'Date',
    guests: 'Guests',
    guestsHint: (capacity: number) => `Between 1 and ${capacity}`,
    contactEmail: 'Contact email',
    submit: 'Request booking',
    submitting: 'Sending request…',
    successHeading: 'Booking requested',
    success: (venue: string, date: string) =>
      `Your request for ${venue} on ${date} is pending approval by the venue team.`,
    viewMyBookings: 'View my bookings',
    errors: {
      dateRequired: 'Choose a date.',
      dateInvalid: 'Enter a valid date.',
      datePast: 'The date cannot be in the past.',
      guestsRequired: 'Enter the number of guests.',
      guestsInvalid: 'Guests must be a whole number.',
      guestsRange: (capacity: number) => `Guests must be between 1 and ${capacity}.`,
      emailRequired: 'Enter a contact email.',
      emailInvalid: 'Enter a valid email address.',
    },
  },
  myBookings: {
    heading: 'My bookings',
    loading: 'Loading your bookings…',
    empty: 'You have no bookings yet.',
    venue: 'Venue',
    date: 'Date',
    guests: 'Guests',
    status: 'Status',
    actions: 'Actions',
    cancel: 'Cancel',
    cancelLabel: (venue: string, date: string) => `Cancel booking for ${venue} on ${date}`,
    cancelling: 'Cancelling…',
    statuses: {
      PENDING: 'Pending',
      APPROVED: 'Approved',
      REJECTED: 'Rejected',
      CANCELLED: 'Cancelled',
      PAID: 'Paid',
    } satisfies Record<BookingStatus, string>,
  },
  auth: {
    signInRequired: 'Sign in required',
    signInExplanation: 'You need to be signed in to book a venue or see your bookings.',
    signIn: 'Sign in',
  },
  errors: {
    retry: 'Try again',
    network: 'Cannot reach Island Venues. Check your connection and try again.',
    server: 'Something went wrong on our side. Please try again in a moment.',
    forbidden: 'You are not allowed to do that.',
    notFound: 'Not found.',
    badResponse: 'The server sent an unexpected response.',
    invalid: 'The request was not accepted.',
    conflict: 'That conflicts with an existing booking.',
  },
  footer: 'Demo application. Venues are fictional.',
} as const;
