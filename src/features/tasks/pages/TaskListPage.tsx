import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useTasks } from '../hooks/useTasks.ts';
import { TaskCard } from '../components/TaskCard.tsx';
import { Button } from '@/components/ui/Button.tsx';
import { ErrorNotice } from '@/components/ui/ErrorNotice.tsx';
import { ConfirmDelete } from '@/components/ui/ConfirmDelete.tsx';
import { SkeletonList } from '@/components/ui/Loading.tsx';
import { PlusIcon } from '@/components/ui/Icons.tsx';
import { useSessionState } from '@/hooks/useSessionState.ts';
import { useClock } from '@/hooks/useClock.ts';
export function TaskListPage(): JSX.Element {
  const navigate = useNavigate();
  const { tasks, loading, error, busy, reload, removeTask, toggleComplete } = useTasks();
  const [selected, setSelected] = useState<string | null>(null);
  const [query, setQuery] = useSessionState('tasks:query', '');
  const [filter, setFilter] = useSessionState('tasks:filter', 'all');
  const [type, setType] = useSessionState('tasks:type', 'all');
  const [order, setOrder] = useSessionState('tasks:order', 'end');
  const now = useClock();
  const filtered = tasks.filter(item => {
    if (!(item.title + ' ' + (item.description ?? '')).toLocaleLowerCase('es').includes(query.toLocaleLowerCase('es'))) return false;
    if (type !== 'all' && item.type !== type) return false;
    if (filter === 'pending') return !item.completed;
    if (filter === 'completed') return item.completed;
    if (filter === 'overdue') return !item.completed && Date.parse(item.endAt) < now;
    return true;
  }).sort((a,b) => order === 'title' ? a.title.localeCompare(b.title, 'es') : (order === 'start' ? a.startAt.localeCompare(b.startAt) : a.endAt.localeCompare(b.endAt)));
  const filters = [['all','Todas'],['pending','Pendientes'],['overdue','Vencidas'],['completed','Completadas']];
  const target = tasks.find(item => item.id === selected);
  return <div className="collection-page anim-fade-in">
    <div className="page-header"><div><p className="eyebrow">TU ESPACIO PERSONAL</p><h1>Tareas</h1><p className="page-intro">Un paso a la vez. Dale espacio a lo importante.</p></div><Button onClick={() => navigate('/tasks/new')}><PlusIcon size={18} /> Nueva</Button></div>
    <div className="filter-panel">
      <label className="search-field"><span>Buscar tareas</span><input type="search" placeholder="Título o descripción…" value={query} onChange={e => setQuery(e.target.value)} /></label>
      <div className="segmented segmented-scroll" aria-label="Filtrar por estado">{filters.map(([key,text]) => <button type="button" key={key} aria-pressed={filter === key} className={filter === key ? 'active' : ''} onClick={() => setFilter(key)}>{text}</button>)}</div>
      <div className="filter-row">
        <label>Tipo<select value={type} onChange={e => setType(e.target.value)}><option value="all">Todos los tipos</option><option value="DAILY">24 horas</option><option value="DEADLINE">Con plazo</option></select></label>
        <label>Orden<select value={order} onChange={e => setOrder(e.target.value)}><option value="end">Por término</option><option value="start">Por inicio</option><option value="title">Por título</option></select></label>
      </div>
    </div>
    <ErrorNotice message={error} onRetry={() => void reload()} />
    <div className="section-heading"><h2>Tu lista</h2><span>{filtered.length} tareas</span></div>
    {loading && tasks.length === 0 ? <SkeletonList count={3} /> : !error && filtered.length === 0 ? <div className="empty-state"><div className="empty-orbit">✓</div><h2>Un espacio para empezar</h2><p>No hay resultados con estos filtros.</p><Button onClick={() => navigate('/tasks/new')}>Crear tarea</Button></div> : <div className="item-list" aria-busy={busy || loading}>{filtered.map(task => <TaskCard key={task.id} task={task} busy={busy} onToggleComplete={id => void toggleComplete(id)} onRemove={setSelected} onEdit={id => navigate('/tasks/' + id + '/edit')} />)}</div>}
    <ConfirmDelete title={target?.title ?? null} busy={busy} onCancel={() => setSelected(null)} onConfirm={() => { if (selected) void removeTask(selected).then(() => setSelected(null)); }} />
  </div>;
}
