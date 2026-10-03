import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { VenueList } from '@/components/venues/VenueList';
import { venues } from '@/test/fixtures';

describe('VenueList', () => {
  it('renders each venue with its name, town, capacity and price per day in MUR', () => {
    render(<VenueList venues={venues} onSelect={vi.fn()} />);

    const cards = screen.getAllByRole('article');
    expect(cards).toHaveLength(2);

    const morne = screen.getByRole('article', { name: 'Le Morne Beach Pavilion' });
    expect(within(morne).getByText('Le Morne')).toBeInTheDocument();
    expect(within(morne).getByText('120 guests')).toBeInTheDocument();
    // Intl separates the code with a non-breaking space; \s matches it.
    expect(within(morne).getByText(/^MUR\s85,000$/)).toBeInTheDocument();

    const curepipe = screen.getByRole('article', { name: 'Curepipe Colonial House' });
    expect(within(curepipe).getByText('Curepipe')).toBeInTheDocument();
    expect(within(curepipe).getByText('40 guests')).toBeInTheDocument();
  });

  it('calls onSelect with the venue id when "View & book" is pressed', async () => {
    const onSelect = vi.fn();
    render(<VenueList venues={venues} onSelect={onSelect} />);

    await userEvent.click(screen.getByRole('button', { name: 'View and book Curepipe Colonial House' }));

    expect(onSelect).toHaveBeenCalledExactlyOnceWith('v-curepipe');
  });

  it('shows an empty state when there are no venues', () => {
    render(<VenueList venues={[]} onSelect={vi.fn()} />);
    expect(screen.getByText('No venues are available right now.')).toBeInTheDocument();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });
});
