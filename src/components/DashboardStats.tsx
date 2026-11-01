import type { Pedido } from '../utils/types';
import { moneda } from '../utils/format';

const claveDia = (fecha: Date) => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' }).format(fecha);

export function DashboardStats({ pedidos }: { pedidos: Pedido[] }) {
  const pendientes = pedidos.filter((pedido) => pedido.estado === 'PENDIENTE');
  const hoy = claveDia(new Date());
  const cobradosHoy = pedidos.filter((pedido) => pedido.estado === 'COBRADO' && Boolean(pedido.cobradoEn) && claveDia(new Date(pedido.cobradoEn!)) === hoy);
  const facturacionHoy = cobradosHoy.reduce((total, pedido) => total + pedido.importe, 0);
  return <div className="stats">
    <div className="stat accent"><span>Pedidos pendientes</span><b>{pendientes.length}</b></div>
    <div className="stat"><span>Total pendiente</span><b>{moneda.format(pendientes.reduce((total, pedido) => total + pedido.importe, 0))}</b></div>
    <div className="stat green"><span>Cobrados hoy</span><b>{cobradosHoy.length}</b></div>
    <div className="stat billing"><span>Facturación de hoy</span><b>{moneda.format(facturacionHoy)}</b></div>
  </div>;
}

