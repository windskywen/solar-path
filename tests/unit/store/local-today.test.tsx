import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { hydrateRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DatePicker } from '@/components/date/DatePicker';
import { SolarStoreProvider, useSolarActions } from '@/store/solar-store';

function ChangeZone() {
  const { setTimezone } = useSolarActions();
  return <button onClick={() => setTimezone('America/Los_Angeles')}>Change zone</button>;
}

function Surface() {
  return <SolarStoreProvider initialDateISO="2026-09-06" initialLocation={{ lat: -27.4698, lng: 153.0251, name: 'Brisbane', source: 'manual' }}>
    <DatePicker initialDateISO="2026-09-06" />
    <ChangeZone />
  </SolarStoreProvider>;
}

describe('Today in the observation timezone', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-06T14:10:00Z'));
  });
  afterEach(() => { cleanup(); vi.useRealTimers(); });

  it('uses Brisbane tomorrow and follows timezone changes before a date is selected', () => {
    render(<Surface />);
    expect(screen.getByLabelText('Select date')).toHaveValue('2026-09-07');
    expect(screen.getByText('✓ Today')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Change zone'));
    expect(screen.getByLabelText('Select date')).toHaveValue('2026-09-06');
  });

  it('preserves a manually selected original server date and uses the current timezone on Today', () => {
    render(<Surface />);
    fireEvent.change(screen.getByLabelText('Select date'), { target: { value: '2026-09-06' } });
    expect(screen.getByLabelText('Select date')).toHaveValue('2026-09-06');
    fireEvent.click(screen.getByText('Go to Today'));
    expect(screen.getByLabelText('Select date')).toHaveValue('2026-09-07');
    fireEvent.click(screen.getByText('Change zone'));
    expect(screen.getByLabelText('Select date')).toHaveValue('2026-09-07');
    fireEvent.click(screen.getByText('Go to Today'));
    expect(screen.getByLabelText('Select date')).toHaveValue('2026-09-06');
  });

  it('refreshes at local midnight without overwriting a manual date', () => {
    vi.setSystemTime(new Date('2026-09-06T13:59:30Z'));
    render(<Surface />);
    act(() => { vi.advanceTimersByTime(60_000); });
    expect(screen.getByLabelText('Select date')).toHaveValue('2026-09-07');
    fireEvent.change(screen.getByLabelText('Select date'), { target: { value: '2026-06-21' } });
    act(() => { vi.advanceTimersByTime(86_400_000); });
    expect(screen.getByLabelText('Select date')).toHaveValue('2026-06-21');
  });

  it('hydrates the cached UTC date without a recoverable mismatch', async () => {
    const container = document.createElement('div');
    container.innerHTML = renderToString(<Surface />);
    expect(container.querySelector('input[type="date"]')).toHaveValue('2026-09-06');
    const onRecoverableError = vi.fn();
    let root!: ReturnType<typeof hydrateRoot>;
    await act(async () => { root = hydrateRoot(container, <Surface />, { onRecoverableError }); });
    expect(container.querySelector('input[type="date"]')).toHaveValue('2026-09-07');
    expect(onRecoverableError).not.toHaveBeenCalled();
    act(() => root.unmount());
  });
});
