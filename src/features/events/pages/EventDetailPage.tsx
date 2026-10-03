import { useNavigate, useParams } from 'react-router-dom';
import { useState } from 'react';
import { useEvents } from '../hooks/useEvents.ts';
import { EventCard } from '../components/EventCard.tsx';
import { Button } from '@/components/ui/Button.tsx';
import { ErrorNotice } from '@/components/ui/ErrorNotice.tsx';
import { ConfirmDelete } from '@/components/ui/ConfirmDelete.tsx';
import { SkeletonList } from '@/components/ui/Loading.tsx';
export function EventDetailPage(): JSX.Element {
  const {id} = useParams(); const navigate = useNavigate(); const [deleting, setDeleting] = useState(false);
  const {events, loading, error, busy, reload, removeEvent} = useEvents();
  const item = events.find(value => value.id === id);
  return <div><Button variant="ghost" onClick={() => navigate('/events')}>← Volver</Button>
    <ErrorNotice message={error} onRetry={() => void reload()} />
    {loading ? <SkeletonList count={1} /> : item ? <EventCard event={item} busy={busy}  onRemove={() => setDeleting(true)} onEdit={() => navigate('/events/' + id + '/edit')} /> : !error && <div className="empty-state"><h2>Este elemento ya no está disponible</h2><p>Puedes volver a tu lista para continuar.</p></div>}
    <ConfirmDelete title={deleting ? item?.title ?? null : null} busy={busy} onCancel={() => setDeleting(false)} onConfirm={() => { if (id) void removeEvent(id).then(ok => { setDeleting(false); if (ok) void navigate('/events'); }); }} />
  </div>;
}
