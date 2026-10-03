import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { EventCard } from './EventCard.tsx';
import type { EventItem } from '@/features/events/types.ts';

const localIso = (y: number, m: number, d: number, h: number, min: number): string =>
  new Date(y, m, d, h, min).toISOString();

const baseEvent: EventItem = {
  id: 'event-1',
  title: 'Reunión de equipo',
  description: 'Con todo el equipo',
  startAt: localIso(2026, 8, 14, 9, 0),
  endAt: localIso(2026, 8, 14, 10, 30),
  color: '#10B981',
  createdAt: localIso(2026, 8, 10, 8, 0),
  updatedAt: localIso(2026, 8, 11, 8, 0),
};

function setup(event: EventItem = baseEvent) {
  const onRemove = vi.fn();
  const onEdit = vi.fn();
  const utils = render(<EventCard event={event} onRemove={onRemove} onEdit={onEdit} />);
  return { ...utils, onRemove, onEdit };
}

describe('EventCard', () => {
  it('muestra el título y el chip de evento', () => {
    setup();
    expect(screen.getByText('Reunión de equipo')).toBeInTheDocument();
    expect(screen.getByText('EVENTO')).toBeInTheDocument();
  });

  it('llama a onEdit con el id al pulsar el lápiz', () => {
    const { onEdit } = setup();
    fireEvent.click(screen.getByRole('button', { name: 'Editar evento Reunión de equipo' }));
    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(onEdit).toHaveBeenCalledWith('event-1');
  });

  it('llama a onRemove con el id al pulsar la papelera', () => {
    const { onRemove } = setup();
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar evento Reunión de equipo' }));
    expect(onRemove).toHaveBeenCalledTimes(1);
    expect(onRemove).toHaveBeenCalledWith('event-1');
  });

  it('los eventos no son completables', () => {
    const { container } = setup();
    expect(container.querySelector('.check-circle')).toBeNull();
  });

  it('al expandir muestra toda la información del evento', () => {
    const { container } = setup();
    const region = container.querySelector<HTMLElement>('.item-details')!;
    expect(region).toHaveAttribute('aria-hidden', 'true');

    fireEvent.click(container.querySelector<HTMLButtonElement>('.item-main')!);

    expect(region).toHaveAttribute('aria-hidden', 'false');
    expect(screen.getByRole('region', { name: 'Detalles del evento' })).toBe(region);

    // El inicio ya aparece en el meta de la card, así que acotamos a los detalles.
    const details = within(region);
    expect(details.getByText('Con todo el equipo')).toBeInTheDocument();
    expect(details.getByText('14 sep 2026, 09:00')).toBeInTheDocument();
    expect(details.getByText('14 sep 2026, 10:30')).toBeInTheDocument();
    expect(details.getByText('1 h 30 min')).toBeInTheDocument();
    expect(details.getByText('Creado')).toBeInTheDocument();
    expect(details.getByText('Actualizado')).toBeInTheDocument();
  });

  it('muestra "Sin descripción" cuando el evento no tiene descripción', () => {
    const { container } = setup({ ...baseEvent, description: undefined });
    fireEvent.click(container.querySelector<HTMLButtonElement>('.item-main')!);
    expect(screen.getByText('Sin descripción')).toBeInTheDocument();
  });
});
