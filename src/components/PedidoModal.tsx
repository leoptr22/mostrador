'use client';
import { useState } from 'react';
import type { Pedido, PedidoInput, Puesto } from '../utils/types';
import { moneda } from '../utils/format';
import { CobroSlider } from './CobroSlider';

const vacio: PedidoInput = { numeroOrden: '', nombre: '', apellido: '', resumen: '', importe: 0, observaciones: '' };

export function PedidoModal({ pedido, puesto, esNuevo, onClose, onSave, onCobrar }: {
  pedido: Pedido | null; puesto: Puesto; esNuevo: boolean; onClose: () => void;
  onSave: (id: string | null, data: PedidoInput) => Promise<void>; onCobrar: (id: string) => Promise<void>;
}) {
  const [data, setData] = useState<PedidoInput>(pedido ? { numeroOrden: pedido.numeroOrden, nombre: pedido.nombre, apellido: pedido.apellido, resumen: pedido.resumen, importe: pedido.importe, observaciones: pedido.observaciones } : vacio);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const change = (key: keyof PedidoInput, value: string | number) => setData({ ...data, [key]: value });
  const etiquetaOrden = data.numeroOrden.trim() ? `Orden #${data.numeroOrden.trim()}` : 'Ticket sin número de orden';

  const save = async () => {
    const next: Record<string, string> = {};
    if (!data.nombre.trim()) next.nombre = 'Ingresá el nombre.';
    if (!data.apellido.trim()) next.apellido = 'Ingresá el apellido.';
    if (!data.importe || data.importe <= 0) next.importe = 'Ingresá un importe válido.';
    setErrors(next);
    if (Object.keys(next).length) return;
    try { setBusy(true); await onSave(pedido?.id ?? null, { ...data, numeroOrden: data.numeroOrden.trim() }); onClose(); }
    catch (error) { setErrors({ general: error instanceof Error ? error.message : 'No se pudo guardar.' }); }
    finally { setBusy(false); }
  };

  const cobrar = async () => {
    if (!pedido) return;
    setBusy(true); await onCobrar(pedido.id); setBusy(false); onClose();
  };

  return <div className="overlay" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <aside className="panel">
      <div className="panel-head"><div><div className="eyebrow">{esNuevo ? 'NUEVO PEDIDO' : etiquetaOrden.toUpperCase()}</div><h2>{esNuevo ? 'Cargar pedido' : 'Detalle del pedido'}</h2></div><button className="close" onClick={onClose}>×</button></div>
      <div className="form-grid">
        <Field label="Número de orden" hint="Opcional"><input value={data.numeroOrden} onChange={(event) => change('numeroOrden', event.target.value)} /></Field>
        <Field label="Importe" required error={errors.importe}><input className={errors.importe ? 'invalid' : ''} type="number" min="0" step="0.01" value={data.importe || ''} onChange={(event) => change('importe', Number(event.target.value))} /></Field>
        <Field label="Nombre" required error={errors.nombre}><input value={data.nombre} onChange={(event) => change('nombre', event.target.value)} /></Field>
        <Field label="Apellido" required error={errors.apellido}><input value={data.apellido} onChange={(event) => change('apellido', event.target.value)} /></Field>
        <Field label="Resumen del trabajo" full><textarea value={data.resumen} onChange={(event) => change('resumen', event.target.value)} /></Field>
        <Field label="Observaciones" full><textarea value={data.observaciones} onChange={(event) => change('observaciones', event.target.value)} /></Field>
      </div>
      {errors.general && <div className="error-box">{errors.general}</div>}
      <div className="panel-actions"><button className="secondary" onClick={onClose}>Cancelar</button><button className="primary" disabled={busy} onClick={save}>{busy ? 'Guardando…' : esNuevo ? 'Crear pedido' : 'Guardar cambios'}</button></div>
      {puesto === 'Caja' && pedido?.estado === 'PENDIENTE' && <div className="cash-box"><span>TOTAL A COBRAR</span><strong>{moneda.format(data.importe)}</strong><CobroSlider disabled={busy} onComplete={() => setConfirm(true)} />{confirm && <div className="confirm"><b>¿Confirmar cobro?</b><div>{etiquetaOrden} · {pedido.nombre} {pedido.apellido} · {moneda.format(data.importe)}</div><div className="panel-actions"><button className="secondary" onClick={() => setConfirm(false)}>Cancelar</button><button className="primary" onClick={cobrar}>Confirmar</button></div></div>}</div>}
    </aside>
  </div>;
}

function Field({ label, required, error, hint, full, children }: { label: string; required?: boolean; error?: string; hint?: string; full?: boolean; children: React.ReactNode }) {
  return <div className={`field ${full ? 'full' : ''}`}><label>{label}{required && <span className="required"> *</span>}{hint && <span className="field-hint">{hint}</span>}</label>{children}{error && <small>{error}</small>}</div>;
}

