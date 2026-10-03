import { useNavigate } from 'react-router-dom';
import { useTasks } from '@/features/tasks/hooks/useTasks.ts';
import { TaskCard } from '@/features/tasks/components/TaskCard.tsx';
import { Button } from '@/components/ui/Button.tsx';
import { SkeletonList } from '@/components/ui/Loading.tsx';
import { PlusIcon, ClipboardIcon } from '@/components/ui/Icons.tsx';
import { useState, useMemo } from 'react';

type Filter = 'all' | 'pending' | 'completed' | 'daily' | 'deadline';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'Todas' },
  { key: 'pending', label: 'Pendientes' },
  { key: 'completed', label: 'Completadas' },
  { key: 'daily', label: '24h' },
  { key: 'deadline', label: 'Plazo' },
];

export function TaskListPage(): JSX.Element {
  const navigate = useNavigate();
  const { tasks, loading, toggleComplete, removeTask } = useTasks();
  const [filter, setFilter] = useState<Filter>('all');

  const filtered = useMemo(() => {
    switch (filter) {
      case 'pending':
        return tasks.filter((t) => !t.completed);
      case 'completed':
        return tasks.filter((t) => t.completed);
      case 'daily':
        return tasks.filter((t) => t.type === 'DAILY');
      case 'deadline':
        return tasks.filter((t) => t.type === 'DEADLINE');
      default:
        return tasks;
    }
  }, [tasks, filter]);

  if (loading) return <SkeletonList count={3} />;

  return (
    <div className="anim-fade-in">
      <div className="page-header">
        <h2 className="page-title">Tareas</h2>
        <Button onClick={() => navigate('/tasks/new')}>
          <PlusIcon /> Nueva
        </Button>
      </div>

      <div className="segmented segmented-scroll" style={{ marginBottom: 16 }}>
        {FILTERS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            className={filter === key ? 'active' : ''}
            onClick={() => setFilter(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state anim-slide-up">
          <div className="icon"><ClipboardIcon size={28} /></div>
          <p style={{ fontWeight: 600 }}>
            {filter === 'all' ? 'Sin tareas' : 'No hay tareas con este filtro'}
          </p>
          <p>
            {filter === 'all'
              ? 'Pulsa el botón + para crear una tarea.'
              : 'Prueba con otro filtro.'}
          </p>
          {filter === 'all' && (
            <Button onClick={() => navigate('/tasks/new')}>Crear primera tarea</Button>
          )}
        </div>
      ) : (
        <div className="stagger">
          {filtered.map((task) => (
            <div key={task.id} style={{ marginBottom: 12 }}>
              <TaskCard
                task={task}
                onToggleComplete={(id) => void toggleComplete(id)}
                onRemove={(id) => void removeTask(id)}
                onEdit={(id) => navigate(`/tasks/${id}/edit`)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
