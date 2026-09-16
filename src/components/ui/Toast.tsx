import { useEffect, useState } from 'react';

interface ToastProps {
  message: string;
  onDone: () => void;
  duration?: number;
}

export function Toast({ message, onDone, duration = 2200 }: ToastProps): JSX.Element {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const hideTimer = setTimeout(() => setVisible(false), duration);
    return () => clearTimeout(hideTimer);
  }, [duration]);

  useEffect(() => {
    if (!visible) {
      const doneTimer = setTimeout(onDone, 300);
      return () => clearTimeout(doneTimer);
    }
  }, [visible, onDone]);

  if (!visible) return <></>;
  return (
    <div className="toast anim-slide-up" role="status">
      {message}
    </div>
  );
}