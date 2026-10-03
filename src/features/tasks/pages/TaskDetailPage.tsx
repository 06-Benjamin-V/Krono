import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { createTaskRepository } from '@/database/repositories/TaskRepository.ts';
import { Button } from '@/components/ui/Button.tsx';
import { Toast } from '@/components/ui/Toast.tsx';
import { TrashIcon, ChevronLeftIcon } from '@/components/ui/Icons.tsx';
import { formatDateTime } from '@/utils/date.ts';
import type { Task } from '@/features/tasks/types.ts';

export function TaskDetailPage(): JSX.Element {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  const loadTask = (): void => {
    if (!id) return;
    createTaskRepository()
      .getById(id)
      .then((t) => setTask(t))
      .catch(() => undefined)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    setLoading(true);
    loadTask();
  }, [id]);

  const handleToggleComplete = async (): Promise<void> => {
    if (!task) return;
    const repo = createTaskRepository();
    if (task.completed) {
      await repo.uncomplete(task.id);
      setTask({ ...task, completed: false, completedAt: undefined });
      setToast('Tarea descompletada');
    } else {
      await repo.complete(task.id);
      setTask({ ...task, completed: true, completedAt: new Date().toISOString() });
      setToast('Tarea completada');
    }
    setTimeout(() => setToast(null), 2200);
  };

  const handleDelete = async (): Promise<void> => {
    if (!task) return;
    if (!window.confirm('¿Eliminar esta tarea?')) return;
    await createTaskRepository().remove(task.id);
    navigate('/tasks');
  };

  if (loading) {
    return (
      <div className="anim-fade-in">
        <div className="page-header">
          <Button variant="ghost" onClick={() => navigate('/tasks')}>
            <ChevronLeftIcon /> Volver
          </Button>
        </div>
        <div className="skeleton" style={{ height: 200 }} />
      </div>
    );
  }

  if (!task) {
    return (
      <div className="anim-fade-in">
        <div className="page-header">
          <Button variant="ghost" onClick={() => navigate('/tasks')}>
            <ChevronLeftIcon /> Volver
          </Button>
        </div>
        <div className="empty-state">
          <p style={{ fontWeight: 600 }}>Tarea no encontrada</p>
          <Button onClick={() => navigate('/tasks')}>Volver a la lista</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="anim-fade-in">
      <div className="page-header">
        <Button variant="ghost" onClick={() => navigate('/tasks')}>
          <ChevronLeftIcon /> Volver
        </Button>
        <h2 className="page-title">Detalle</h2>
        <div />
      </div>

      <div className="card" style={{ '--item-color': task.color } as React.CSSProperties}>
        <div className="item-body">
          <div className="item-title">{task.title}</div>
          <div className="item-subtitle" style={{ marginBottom: 8 }}>
            <span className={`chip ${task.type === 'DAILY' ? 'chip-daily' : 'chip-deadline'}`}>
              {task.type === 'DAILY' ? '24 HORAS' : 'PLAZO'}
            </span>
          </div>
          {task.description && (
            <p style={{ marginBottom: 8, color: 'var(--text-secondary)' }}>{task.description}</p>
          )}
          <div className="item-time">
            {formatDateTime(task.startAt)} → {formatDateTime(task.endAt)}
          </div>
          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginTop: 4 }}>
            Creada: {new Date(task.createdAt).toLocaleDateString('es-ES')}
          </div>
          {task.completedAt && (
            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--success)' }}>
              Completada: {new Date(task.completedAt).toLocaleDateString('es-ES')}
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
        <Button onClick={handleToggleComplete}>
          {task.completed ? 'Descompletar' : 'Completar'}
        </Button>
        <Button variant="secondary" onClick={() => navigate(`/tasks/${task.id}/edit`)}>
          Editar
        </Button>
        <Button variant="danger" onClick={handleDelete}>
          <TrashIcon /> Eliminar
        </Button>
      </div>

      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </div>
  );
}
