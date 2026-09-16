import { useEffect, useState } from 'react';
import { useTheme } from '@/hooks/useTheme.ts';
import { MoonIcon, SunIcon } from './Icons.tsx';

interface TopBarProps {
  title: string;
}

export function TopBar({ title }: TopBarProps): JSX.Element {
  const { theme, toggleTheme } = useTheme();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = (): void => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={`topbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="topbar-brand">
        <span className="dot" />
        <span>{title}</span>
      </div>
      <button
        type="button"
        className="btn-icon"
        onClick={toggleTheme}
        aria-label={theme === 'light' ? 'Activar tema oscuro' : 'Activar tema claro'}
        title={theme === 'light' ? 'Tema oscuro' : 'Tema claro'}
      >
        {theme === 'light' ? <MoonIcon /> : <SunIcon />}
      </button>
    </header>
  );
}