import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { TaskCard } from './TaskCard.tsx';
import type { Task } from '@/features/tasks/types.ts';

const localIso = (y: number, m: number, d: number, h: number, min: number): string =>
  new Date(y, m, d, h, min).toISOString();

const baseTask: Task = {
  id: 'task-1',
  title: 'Comprar pan',
  description: 'Con semillas',
  type: 'DAILY',
  startAt: localIso(2026, 8, 14, 10, 0),
  endAt: localIso(2026, 8, 15, 10, 0),
  color: '#3B82F6',
  completed: false,
  createdAt: localIso(2026, 8, 13, 9, 0),
  updatedAt: localIso(2026, 8, 13, 9, 0),
};

function setup(task: Task = baseTask) {
  const onToggleComplete = vi.fn();
  const onRemove = vi.fn();
  const onEdit = vi.fn();
  const utils = render(
    <TaskCard
      task={task}
      onToggleComplete={onToggleComplete}
      onRemove={onRemove}
      onEdit={onEdit}
    />,
  );
  return { ...utils, onToggleComplete, onRemove, onEdit };
}

describe('TaskCard', () => {
  it('muestra el título, el chip de tipo y el resumen horario', () => {
    setup();
    expect(screen.getByText('Comprar pan')).toBeInTheDocument();
    expect(screen.getByText('24 HORAS')).toBeInTheDocument();
    expect(screen.getByText('10:00 → 10:00')).toBeInTheDocument();
  });

  it('llama a onEdit con el id al pulsar el lápiz', () => {
    const { onEdit } = setup();
    fireEvent.click(screen.getByRole('button', { name: 'Editar tarea Comprar pan' }));
    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(onEdit).toHaveBeenCalledWith('task-1');
  });

  it('llama a onRemove con el id al pulsar la papelera', () => {
    const { onRemove } = setup();
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar tarea Comprar pan' }));
    expect(onRemove).toHaveBeenCalledTimes(1);
    expect(onRemove).toHaveBeenCalledWith('task-1');
  });

  it('el botón de completar no expande la card', () => {
    const { container, onToggleComplete } = setup();
    fireEvent.click(screen.getByRole('button', { name: 'Marcar como completada' }));
    expect(onToggleComplete).toHaveBeenCalledWith('task-1');
    expect(container.querySelector('.item-main')).toHaveAttribute('aria-expanded', 'false');
  });

  it('al expandir muestra toda la información de la tarea', () => {
    const { container } = setup();
    const region = container.querySelector<HTMLElement>('.item-details')!;
    expect(region).toHaveAttribute('aria-hidden', 'true');

    fireEvent.click(container.querySelector<HTMLButtonElement>('.item-main')!);

    expect(region).toHaveAttribute('aria-hidden', 'false');
    expect(screen.getByRole('region', { name: 'Detalles de la tarea' })).toBe(region);
    expect(screen.getByText('Con semillas')).toBeInTheDocument();
    expect(screen.getByText('Pendiente')).toBeInTheDocument();
    expect(screen.getByText('24 h')).toBeInTheDocument();
    expect(screen.getByText('14 sep 2026, 10:00')).toBeInTheDocument();
    expect(screen.getByText('15 sep 2026, 10:00')).toBeInTheDocument();
    expect(screen.getByText('Tipo')).toBeInTheDocument();
  });

  it('muestra "Sin descripción" cuando la tarea no tiene descripción', () => {
    const { container } = setup({ ...baseTask, description: undefined });
    fireEvent.click(container.querySelector<HTMLButtonElement>('.item-main')!);
    expect(screen.getByText('Sin descripción')).toBeInTheDocument();
  });

  it('refleja el estado completado y la fecha de completado', () => {
    const completedAt = localIso(2026, 8, 14, 12, 0);
    const { container } = setup({ ...baseTask, completed: true, completedAt });

    expect(container.querySelector('.item-card')).toHaveClass('completed');
    expect(container.querySelector('.check-circle')).toHaveClass('checked');
    expect(screen.getByRole('button', { name: 'Marcar como pendiente' })).toBeInTheDocument();

    fireEvent.click(container.querySelector<HTMLButtonElement>('.item-main')!);
    expect(screen.getByText('Completada')).toBeInTheDocument();
    expect(screen.getByText('Completada el')).toBeInTheDocument();
    expect(screen.getByText('14 sep 2026, 12:00')).toBeInTheDocument();
  });

  it('expone la card con la clase de expansión al abrir', () => {
    const { container } = setup();
    const toggle = container.querySelector<HTMLButtonElement>('.item-main')!;
    fireEvent.click(toggle);
    expect(container.querySelector('.item-card')).toHaveClass('expanded');
    fireEvent.click(toggle);
    expect(container.querySelector('.item-card')).not.toHaveClass('expanded');
  });
});
