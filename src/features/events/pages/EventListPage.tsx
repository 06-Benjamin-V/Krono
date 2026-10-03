import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useEvents } from '../hooks/useEvents.ts';
import { EventCard } from '../components/EventCard.tsx';
import { Button } from '@/components/ui/Button.tsx';
import { ErrorNotice } from '@/components/ui/ErrorNotice.tsx';
import { ConfirmDelete } from '@/components/ui/ConfirmDelete.tsx';
import { SkeletonList } from '@/components/ui/Loading.tsx';
import { PlusIcon } from '@/components/ui/Icons.tsx';
import { useSessionState } from '@/hooks/useSessionState.ts';
import { useClock } from '@/hooks/useClock.ts';
export function EventListPage(): JSX.Element {
  const navigate = useNavigate();
  const { events, loading, error, busy, reload, removeEvent } = useEvents();
  const [selected, setSelected] = useState<string | null>(null);
  const [query, setQuery] = useSessionState('events:query', '');
  const [filter, setFilter] = useSessionState('events:filter', 'all');

  const [order, setOrder] = useSessionState('events:order', 'end');
  const now = useClock();
  const filtered = events.filter(item => {
    if (!(item.title + ' ' + (item.description ?? '')).toLocaleLowerCase('es').includes(query.toLocaleLowerCase('es'))) return false;
    if (filter === 'upcoming') return Date.parse(item.startAt) > now;
    if (filter === 'current') return Date.parse(item.startAt) <= now && Date.parse(item.endAt) >= now;
    if (filter === 'past') return Date.parse(item.endAt) < now;
    return true;
  }).sort((a,b) => order === 'title' ? a.title.localeCompare(b.title, 'es') : (order === 'start' ? a.startAt.localeCompare(b.startAt) : a.endAt.localeCompare(b.endAt)));
  const filters = [['all','Todos'],['current','En curso'],['upcoming','Próximos'],['past','Pasados']];
  const target = events.find(item => item.id === selected);
  return <div className="collection-page anim-fade-in">
    <div className="page-header"><div><p className="eyebrow">TU ESPACIO PERSONAL</p><h1>Eventos</h1><p className="page-intro">Reserva tiempo para lo que quieres vivir.</p></div><Button onClick={() => navigate('/events/new')}><PlusIcon size={18} /> Nuevo</Button></div>
    <div className="filter-panel">
      <label className="search-field"><span>Buscar eventos</span><input type="search" placeholder="Título o descripción…" value={query} onChange={e => setQuery(e.target.value)} /></label>
      <div className="segmented segmented-scroll" aria-label="Filtrar por estado">{filters.map(([key,text]) => <button type="button" key={key} aria-pressed={filter === key} className={filter === key ? 'active' : ''} onClick={() => setFilter(key)}>{text}</button>)}</div>
      <div className="filter-row">

        <label>Orden<select value={order} onChange={e => setOrder(e.target.value)}><option value="end">Por término</option><option value="start">Por inicio</option><option value="title">Por título</option></select></label>
      </div>
    </div>
    <ErrorNotice message={error} onRetry={() => void reload()} />
    <div className="section-heading"><h2>Tu agenda de eventos</h2><span>{filtered.length} eventos</span></div>
    {loading && events.length === 0 ? <SkeletonList count={3} /> : !error && filtered.length === 0 ? <div className="empty-state"><div className="empty-orbit">◷</div><h2>Haz espacio para un buen momento</h2><p>No hay resultados con estos filtros.</p><Button onClick={() => navigate('/events/new')}>Crear evento</Button></div> : <div className="item-list" aria-busy={busy || loading}>{filtered.map(event => <EventCard key={event.id} event={event} busy={busy}  onRemove={setSelected} onEdit={id => navigate('/events/' + id + '/edit')} />)}</div>}
    <ConfirmDelete title={target?.title ?? null} busy={busy} onCancel={() => setSelected(null)} onConfirm={() => { if (selected) void removeEvent(selected).then(() => setSelected(null)); }} />
  </div>;
}
