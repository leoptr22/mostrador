import type { Pedido } from '../utils/types';
import { moneda } from '../utils/format';

const claveDia = (fecha: Date) => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' }).format(fecha);

export function DashboardStats({ pedidos }: { pedidos: Pedido[] }) {
  const pendientes = pedidos.filter((pedido) => pedido.estado === 'PENDIENTE');
  const hoy = claveDia(new Date());
  const cobradosHoy = pedidos.filter((pedido) => pedido.estado === 'COBRADO' && Boolean(pedido.cobradoEn) && claveDia(new Date(pedido.cobradoEn!)) === hoy);
  const facturacionHoy = cobradosHoy.reduce((total, pedido) => total + pedido.importe, 0);
  const facturacionEfectivo = cobradosHoy.filter((pedido) => pedido.medioPago === 'EFECTIVO').reduce((total, pedido) => total + pedido.importe, 0);
  const facturacionTransferencia = cobradosHoy.filter((pedido) => pedido.medioPago === 'TRANSFERENCIA').reduce((total, pedido) => total + pedido.importe, 0);
  return <div className="stats">
    <div className="stat accent"><span>Pedidos pendientes</span><b>{pendientes.length}</b></div>
    <div className="stat"><span>Total pendiente</span><b>{moneda.format(pendientes.reduce((total, pedido) => total + pedido.importe, 0))}</b></div>
    <div className="stat green"><span>Cobrados hoy</span><b>{cobradosHoy.length}</b></div>
    <details className="stat billing"><summary><span>Facturación de hoy</span><b>{moneda.format(facturacionHoy)}</b><small>Ver detalle</small></summary><div className="billing-breakdown"><div><span>Efectivo</span><strong>{moneda.format(facturacionEfectivo)}</strong></div><div><span>Transferencias</span><strong>{moneda.format(facturacionTransferencia)}</strong></div><div className="billing-total"><span>Total</span><strong>{moneda.format(facturacionHoy)}</strong></div></div></details>
  </div>;
}

