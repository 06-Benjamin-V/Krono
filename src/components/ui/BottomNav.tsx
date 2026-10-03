import { NavLink } from 'react-router-dom';
import { ListIcon, CalendarIcon, SettingsIcon, HomeIcon, ClockIcon } from './Icons.tsx';

export function BottomNav(): JSX.Element {
  const items = [
    { to: '/today', label: 'Hoy', Icon: HomeIcon },
    { to: '/calendar', label: 'Calendario', Icon: CalendarIcon },
    { to: '/tasks', label: 'Tareas', Icon: ListIcon },
    { to: '/events', label: 'Eventos', Icon: ClockIcon },
    { to: '/settings', label: 'Ajustes', Icon: SettingsIcon },
  ];

  return (
    <nav className="bottom-nav" aria-label="Navegación principal">
      {items.map(({ to, label, Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <Icon />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
