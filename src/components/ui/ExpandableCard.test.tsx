import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ExpandableCard } from './ExpandableCard.tsx';

const baseProps = {
  color: '#3B82F6',
  title: 'Mi tarea',
  details: <p>Detalle completo</p>,
  detailsLabel: 'Detalles de prueba',
};

describe('ExpandableCard', () => {
  it('renderiza el título y el contenido de detalles', () => {
    render(<ExpandableCard {...baseProps} />);
    expect(screen.getByText('Mi tarea')).toBeInTheDocument();
    expect(screen.getByText('Detalle completo')).toBeInTheDocument();
  });

  it('arranca colapsada y se expande y colapsa al pulsar', () => {
    const { container } = render(<ExpandableCard {...baseProps} />);
    const toggle = container.querySelector<HTMLButtonElement>('.item-main')!;
    const region = container.querySelector<HTMLElement>('.item-details')!;

    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(region).toHaveAttribute('role', 'region');
    expect(region).toHaveAttribute('aria-label', 'Detalles de prueba');
    expect(region).toHaveAttribute('aria-hidden', 'true');
    expect(container.querySelector('.item-card')).not.toHaveClass('expanded');

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(region).toHaveAttribute('aria-hidden', 'false');
    expect(container.querySelector('.item-card')).toHaveClass('expanded');
    expect(container.querySelector('.item-details')).toHaveClass('open');
    // Solo cobra nombre accesible cuando la región está visible.
    expect(screen.getByRole('region', { name: 'Detalles de prueba' })).toBe(region);

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(region).toHaveAttribute('aria-hidden', 'true');
    expect(container.querySelector('.item-details')).not.toHaveClass('open');
  });

  it('respeta defaultExpanded', () => {
    const { container } = render(<ExpandableCard {...baseProps} defaultExpanded />);
    expect(container.querySelector('.item-main')).toHaveAttribute('aria-expanded', 'true');
    expect(container.querySelector('.item-details')).toHaveClass('open');
  });

  it('enlaza el botón con la región mediante aria-controls', () => {
    const { container } = render(<ExpandableCard {...baseProps} />);
    const toggle = container.querySelector<HTMLButtonElement>('.item-main')!;
    const region = container.querySelector<HTMLElement>('.item-details')!;
    expect(toggle.getAttribute('aria-controls')).toBe(region.id);
    expect(region.id).not.toBe('');
  });

  it('renderiza los slots leading, actions y details', () => {
    const { container } = render(
      <ExpandableCard
        {...baseProps}
        leading={<button type="button">check</button>}
        actions={<button type="button">editar</button>}
        completed
      />,
    );
    expect(container.querySelector('.leading button')).toBeInTheDocument();
    expect(container.querySelector('.item-actions button')).toBeInTheDocument();
    expect(container.querySelector('.item-details-inner')).toHaveTextContent('Detalle completo');
    expect(container.querySelector('.item-card')).toHaveClass('completed');
  });

  it('no anida botones interactivos dentro del botón de expansión', () => {
    const { container } = render(
      <ExpandableCard
        {...baseProps}
        leading={<button type="button">check</button>}
        actions={<button type="button">editar</button>}
      />,
    );
    expect(container.querySelector('.item-main button')).toBeNull();
  });
});
