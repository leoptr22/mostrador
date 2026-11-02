import type { Pedido } from '../utils/types';
import { hora, moneda } from '../utils/format';

export function PedidoCard({ pedido, onClick }: { pedido: Pedido; onClick: () => void; compact?: boolean }) {
  const numero = pedido.numeroOrden.trim();
  return <button className="pedido-card" onClick={onClick}>
    <div className="card-top">
      <span className={`order ${numero ? '' : 'no-order'}`}>{numero ? `ORDEN #${numero}` : 'SIN NÚMERO DE ORDEN'}</span>
      <span className={`badge ${pedido.estado === 'COBRADO' ? 'paid' : ''}`}>{pedido.estado}</span>
    </div>
    <h2>{pedido.nombre} {pedido.apellido}</h2>
    <div className="summary">{pedido.resumen || 'Sin resumen del trabajo'}</div>
    <div className="amount">{moneda.format(pedido.importe)}</div>
    {pedido.observaciones && <div className="note"><b>OBSERVACIONES</b>{pedido.observaciones}</div>}
    <div className="card-footer">
      <span>{pedido.estado === 'COBRADO' ? `Cobrado por ${pedido.cobradoPor}${pedido.medioPago ? ` · ${pedido.medioPago === 'EFECTIVO' ? 'Efectivo' : 'Transferencia'}` : ''}` : `Cargado por ${pedido.creadoPor}`}</span>
      <strong>{hora(pedido.cobradoEn || pedido.creadoEn)}</strong>
    </div>
  </button>;
}

