'use client';
import { useMemo, useState } from 'react';
import { Header } from '../src/components/Header';
import { DashboardStats } from '../src/components/DashboardStats';
import { PedidoCard } from '../src/components/PedidoCard';
import { PedidoModal } from '../src/components/PedidoModal';
import { SelectorPuesto } from '../src/components/SelectorPuesto';
import { Buscador } from '../src/components/Buscador';
import { usePuesto } from '../src/hooks/usePuesto';
import { usePedidos } from '../src/hooks/usePedidos';
import type { Pedido } from '../src/utils/types';

const fechaClave = (date: Date) => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' }).format(date);
const diasHistorial = Array.from({ length: 7 }, (_, offset) => {
  const date = new Date(); date.setDate(date.getDate() - offset);
  return { offset, key: fechaClave(date), label: offset === 0 ? 'Hoy' : offset === 1 ? 'Ayer' : new Intl.DateTimeFormat('es-AR', { weekday: 'short', day: '2-digit', month: '2-digit', timeZone: 'America/Argentina/Buenos_Aires' }).format(date) };
});

export default function Home() {
  const { puesto, seleccionarPuesto, cambiarPuesto } = usePuesto();
  const api = usePedidos(puesto);
  const [vista, setVista] = useState<'pendientes' | 'historial'>('pendientes');
  const [busqueda, setBusqueda] = useState('');
  const [seleccionado, setSeleccionado] = useState<Pedido | null>(null);
  const [nuevo, setNuevo] = useState(false);
  const [ascendente, setAscendente] = useState(true);
  const [dia, setDia] = useState(diasHistorial[0].key);
  const [confirmarBorrado, setConfirmarBorrado] = useState(false);
  const [borrando, setBorrando] = useState(false);

  const visibles = useMemo(() => {
    const query = busqueda.trim().toLocaleLowerCase('es');
    return api.pedidos
      .filter((pedido) => vista === 'pendientes' ? pedido.estado === 'PENDIENTE' : pedido.estado === 'COBRADO' && !!pedido.cobradoEn && fechaClave(new Date(pedido.cobradoEn)) === dia)
      .filter((pedido) => !query || `${pedido.numeroOrden} ${pedido.nombre} ${pedido.apellido}`.toLocaleLowerCase('es').includes(query))
      .sort((a, b) => (new Date(a.creadoEn).getTime() - new Date(b.creadoEn).getTime()) * (ascendente ? 1 : -1));
  }, [api.pedidos, vista, busqueda, ascendente, dia]);

  const borrar = async () => {
    setBorrando(true);
    try { await api.borrarHistorial(); setConfirmarBorrado(false); }
    finally { setBorrando(false); }
  };

  if (!puesto) return <SelectorPuesto onSelect={seleccionarPuesto} />;
  return <main className="app-shell">
    <Header puesto={puesto} vista={vista} onVista={setVista} onCambiarPuesto={cambiarPuesto} onNuevo={() => setNuevo(true)} />
    <section className="content">
      <div className="eyebrow">CENTRO DE OPERACIONES</div>
      <div className="title-row"><div><h1>{vista === 'pendientes' ? 'Pedidos en mostrador' : 'Historial de cobros'}</h1><p>{vista === 'pendientes' ? 'Seguimiento y control de tickets' : 'Consultá los tickets cobrados de los últimos 7 días.'}</p></div><span className={`live-pill ${api.demo ? 'demo' : ''}`}><i />{api.demo ? 'MODO DEMO' : 'SINCRONIZADO'}</span></div>
      <DashboardStats pedidos={api.pedidos} />
      {vista === 'historial' && <div className="history-controls"><div className="day-tabs" role="group" aria-label="Día del historial">{diasHistorial.map((item) => <button key={item.key} className={dia === item.key ? 'active' : ''} onClick={() => setDia(item.key)}>{item.label}</button>)}</div><button className="danger-button" onClick={() => setConfirmarBorrado(true)} disabled={!api.pedidos.some((pedido) => pedido.estado === 'COBRADO')}>Borrar historial</button></div>}
      <div className="toolbar"><Buscador value={busqueda} onChange={setBusqueda} placeholder={vista === 'pendientes' ? 'Buscar orden o cliente…' : 'Buscar orden o cliente en este día…'} /><button className="sort-button" onClick={() => setAscendente(!ascendente)}>↕ {ascendente ? 'Más antiguos primero' : 'Más recientes primero'}</button></div>
      {api.error && <div className="error-box">{api.error}<button onClick={api.refrescar}>Reintentar</button></div>}
      {api.loading && !api.pedidos.length ? <div className="empty">Cargando pedidos…</div> : visibles.length ? <div className={vista === 'pendientes' ? 'pedido-grid' : 'history-list'}>{visibles.map((pedido) => <PedidoCard key={pedido.id} pedido={pedido} compact={vista === 'historial'} onClick={() => setSeleccionado(pedido)} />)}</div> : <div className="empty"><strong>{vista === 'pendientes' ? 'No hay pedidos pendientes' : 'No hay tickets cobrados este día'}</strong><span>Probá otra fecha o cambiá la búsqueda.</span></div>}
    </section>
    {(nuevo || seleccionado) && <PedidoModal pedido={seleccionado} puesto={puesto} esNuevo={nuevo} onClose={() => { setNuevo(false); setSeleccionado(null); }} onSave={api.guardar} onCobrar={api.cobrar} />}
    {confirmarBorrado && <div className="overlay confirm-overlay"><div className="delete-dialog" role="dialog" aria-modal="true"><div className="delete-icon">!</div><h2>¿Borrar todo el historial?</h2><p>Se eliminarán definitivamente todos los tickets cobrados. Los pedidos pendientes no se modificarán.</p><div className="panel-actions"><button className="secondary" onClick={() => setConfirmarBorrado(false)} disabled={borrando}>Cancelar</button><button className="danger-confirm" onClick={borrar} disabled={borrando}>{borrando ? 'Borrando…' : 'Sí, borrar historial'}</button></div></div></div>}
    {api.mensaje && <div className="toast">✓ {api.mensaje}</div>}
  </main>;
}

