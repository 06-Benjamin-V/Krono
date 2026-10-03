import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { createTaskRepository } from '@/database/repositories/TaskRepository.ts';
import { TaskForm } from '@/features/tasks/components/TaskForm.tsx';
import { Button } from '@/components/ui/Button.tsx';
import { ChevronLeftIcon } from '@/components/ui/Icons.tsx';
import type { Task } from '@/features/tasks/types.ts';

export function TaskFormPage(): JSX.Element {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const isEdit = id != null;
  const [initialTask, setInitialTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(isEdit);

  useEffect(() => {
    if (!isEdit || !id) {
      setLoading(false);
      return;
    }
    createTaskRepository()
      .getById(id)
      .then((task) => {
        setInitialTask(task);
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, [isEdit, id]);

  const handleSaved = (): void => {
    navigate('/tasks');
  };

  const handleCancel = (): void => {
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
        <div className="skeleton" style={{ height: 400 }} />
      </div>
    );
  }

  if (isEdit && !initialTask) {
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
        <Button variant="ghost" onClick={handleCancel}>
          <ChevronLeftIcon /> Volver
        </Button>
        <h2 className="page-title">{isEdit ? 'Editar tarea' : 'Nueva tarea'}</h2>
        <div />
      </div>
      <TaskForm
        initialTask={initialTask}
        onCreated={handleSaved}
        onCancel={handleCancel}
      />
    </div>
  );
}
