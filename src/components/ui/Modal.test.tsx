import { useState } from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Modal } from './Modal.tsx';
function Example() {
  const [open,setOpen] = useState(false);
  return <><button onClick={() => setOpen(true)}>Abrir</button><Modal open={open} title="Confirmación" onClose={() => setOpen(false)}><button onClick={() => setOpen(false)}>Cancelar</button></Modal></>;
}
describe('Diálogo accesible', () => {
  it('contiene el foco, permite Escape y devuelve foco al activador', async () => {
    const user = userEvent.setup(); render(<Example />);
    const trigger = screen.getByText('Abrir'); await user.click(trigger);
    expect(screen.getByLabelText('Cerrar')).toHaveFocus();
    await user.tab({shift:true}); expect(screen.getByText('Cancelar')).toHaveFocus();
    await user.tab(); expect(screen.getByLabelText('Cerrar')).toHaveFocus();
    await user.keyboard('{Escape}'); expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });
});
