import { useNavigate, useParams } from 'react-router-dom';
import { useState } from 'react';
import { useTasks } from '../hooks/useTasks.ts';
import { TaskCard } from '../components/TaskCard.tsx';
import { Button } from '@/components/ui/Button.tsx';
import { ErrorNotice } from '@/components/ui/ErrorNotice.tsx';
import { ConfirmDelete } from '@/components/ui/ConfirmDelete.tsx';
import { SkeletonList } from '@/components/ui/Loading.tsx';
export function TaskDetailPage(): JSX.Element {
  const {id} = useParams(); const navigate = useNavigate(); const [deleting, setDeleting] = useState(false);
  const {tasks, loading, error, busy, reload, removeTask, toggleComplete} = useTasks();
  const item = tasks.find(value => value.id === id);
  return <div><Button variant="ghost" onClick={() => navigate('/tasks')}>← Volver</Button>
    <ErrorNotice message={error} onRetry={() => void reload()} />
    {loading ? <SkeletonList count={1} /> : item ? <TaskCard task={item} busy={busy} onToggleComplete={value => void toggleComplete(value)} onRemove={() => setDeleting(true)} onEdit={() => navigate('/tasks/' + id + '/edit')} /> : !error && <div className="empty-state"><h2>Este elemento ya no está disponible</h2><p>Puedes volver a tu lista para continuar.</p></div>}
    <ConfirmDelete title={deleting ? item?.title ?? null : null} busy={busy} onCancel={() => setDeleting(false)} onConfirm={() => { if (id) void removeTask(id).then(ok => { setDeleting(false); if (ok) void navigate('/tasks'); }); }} />
  </div>;
}
