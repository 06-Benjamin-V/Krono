import { HomeIcon, CalendarIcon, SettingsIcon } from './Icons.tsx';

export type Route = 'home' | 'calendar' | 'settings';

interface BottomNavProps {
  route: Route;
  onChange: (route: Route) => void;
}

const ITEMS: { route: Route; label: string; Icon: typeof HomeIcon }[] = [
  { route: 'home', label: 'Hoy', Icon: HomeIcon },
  { route: 'calendar', label: 'Calendario', Icon: CalendarIcon },
  { route: 'settings', label: 'Ajustes', Icon: SettingsIcon },
];

export function BottomNav({ route, onChange }: BottomNavProps): JSX.Element {
  return (
    <nav className="bottom-nav" aria-label="Navegación principal">
      {ITEMS.map(({ route: r, label, Icon }) => (
        <button
          key={r}
          type="button"
          className={`nav-item ${route === r ? 'active' : ''}`}
          aria-current={route === r ? 'page' : undefined}
          onClick={() => onChange(r)}
        >
          <Icon />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}