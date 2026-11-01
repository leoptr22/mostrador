import { ES_MODO_DEMO, GOOGLE_SHEETS_API_URL } from '../config/config';
import type { Pedido, PedidoInput, Puesto } from '../utils/types';

let demo: Pedido[] = [];
type ApiResponse = { ok?: boolean; error?: string; data?: unknown };

async function api(action: string, payload?: Record<string, unknown>) {
  const response = await fetch(`${GOOGLE_SHEETS_API_URL}?action=${action}`, {
    method: payload ? 'POST' : 'GET',
    headers: payload ? { 'Content-Type': 'text/plain;charset=utf-8' } : undefined,
    body: payload ? JSON.stringify({ action, ...payload }) : undefined,
  });
  if (!response.ok) throw new Error('No se pudo conectar con Google Sheets.');
  const json = (await response.json()) as ApiResponse;
  if (json.ok === false) throw new Error(json.error || 'La operación no pudo completarse.');
  return json.data ?? json;
}

export async function getPedidos(): Promise<Pedido[]> {
  return ES_MODO_DEMO ? [...demo] : (api('getPedidos') as Promise<Pedido[]>);
}

export async function crearPedido(datos: PedidoInput, puesto: Puesto) {
  if (ES_MODO_DEMO) {
    const pedido: Pedido = { ...datos, id: crypto.randomUUID(), estado: 'PENDIENTE', creadoPor: puesto, creadoEn: new Date().toISOString() };
    demo = [...demo, pedido];
    return pedido;
  }
  return api('crearPedido', { pedido: datos, puesto });
}

export async function actualizarPedido(id: string, datos: PedidoInput, puesto: Puesto) {
  if (ES_MODO_DEMO) {
    demo = demo.map((pedido) => pedido.id === id ? { ...pedido, ...datos, modificadoPor: puesto, modificadoEn: new Date().toISOString() } : pedido);
    return;
  }
  return api('actualizarPedido', { id, pedido: datos, puesto });
}

export async function marcarComoCobrado(id: string, puesto: Puesto) {
  if (ES_MODO_DEMO) {
    demo = demo.map((pedido) => pedido.id === id ? { ...pedido, estado: 'COBRADO', cobradoPor: puesto, cobradoEn: new Date().toISOString() } : pedido);
    return;
  }
  return api('cobrarPedido', { id, puesto });
}

export async function borrarHistorial(puesto: Puesto) {
  if (ES_MODO_DEMO) {
    demo = demo.filter((pedido) => pedido.estado !== 'COBRADO');
    return;
  }
  return api('borrarHistorial', { puesto });
}

