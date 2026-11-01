'use client';
import { useCallback, useEffect, useState } from 'react';
import { ES_MODO_DEMO, REFRESH_INTERVAL } from '../config/config';
import * as service from '../services/googleSheetsService';
import type { Pedido, PedidoInput, Puesto } from '../utils/types';

export function usePedidos(puesto: Puesto | null) {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const refrescar = useCallback(async () => {
    try { setPedidos(await service.getPedidos()); setError(''); }
    catch (e) { setError(e instanceof Error ? e.message : 'Error inesperado'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => {
    if (!puesto) return;
    refrescar();
    const id = setInterval(refrescar, REFRESH_INTERVAL);
    return () => clearInterval(id);
  }, [puesto, refrescar]);
  const avisar = (texto: string) => { setMensaje(texto); setTimeout(() => setMensaje(''), 2600); };
  const guardar = async (id: string | null, data: PedidoInput) => {
    if (!puesto) return;
    const numero = data.numeroOrden.trim().toLocaleLowerCase('es');
    const duplicado = numero && pedidos.find((pedido) => pedido.numeroOrden.trim().toLocaleLowerCase('es') === numero && pedido.id !== id);
    if (duplicado) throw new Error(`La orden #${data.numeroOrden} ya existe.`);
    if (id) await service.actualizarPedido(id, data, puesto); else await service.crearPedido(data, puesto);
    await refrescar(); avisar(id ? 'Pedido actualizado' : 'Pedido creado correctamente');
  };
  const cobrar = async (id: string) => {
    if (!puesto) return;
    await service.marcarComoCobrado(id, puesto); await refrescar(); avisar('Cobro registrado');
  };
  const borrarHistorial = async () => {
    if (!puesto) return;
    await service.borrarHistorial(puesto); await refrescar(); avisar('Historial borrado correctamente');
  };
  return { pedidos, loading, error, mensaje, demo: ES_MODO_DEMO, refrescar, guardar, cobrar, borrarHistorial };
}

