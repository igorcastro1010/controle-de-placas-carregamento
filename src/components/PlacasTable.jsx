import PlateCard from './PlateCard';
import StatusBadge from './StatusBadge';
import { formatDate, formatDateTime, formatTime } from '../services/placasService';

const columns = [
  'ordem',
  'data',
  'hora',
  'placa',
  'tipo_veiculo',
  'placa_cavalo',
  'placa_carreta',
  'motorista',
  'telefone',
  'rota_1',
  'rota_2',
  'rota_3',
  'primeira_ligacao',
  'segunda_ligacao',
  'terceira_ligacao',
  'status',
  'responsavel',
  'ocorrido',
  'auditoria',
  'ações',
];

function ActiveQueueCards({ items, onAction, onMove, busyId, canViewAudit }) {
  return (
    <div className="queue-card-list">
      {items.map((item, index) => (
        <PlateCard
          key={item.id}
          item={item}
          index={index}
          visualOrder={index + 1}
          itemsLength={items.length}
          busyId={busyId}
          canViewAudit={canViewAudit}
          onAction={onAction}
          onMove={onMove}
        />
      ))}
    </div>
  );
}

function AuditInfo({ item }) {
  if (item.status === 'Finalizado') {
    return (
      <div className="audit-info">
        <span>Finalizado por: {item.finalizado_por || '-'}</span>
        <span>Finalizado em: {formatDateTime(item.finalizado_em)}</span>
      </div>
    );
  }

  if (item.status === 'Cancelado') {
    return (
      <div className="audit-info">
        <span>Cancelado por: {item.cancelado_por || '-'}</span>
        <span>Cancelado em: {formatDateTime(item.cancelado_em)}</span>
      </div>
    );
  }

  return <span className="muted">-</span>;
}

export default function PlacasTable({ items, onAction, onMove, finalizados = false, busyId, canViewAudit = false }) {
  if (!items.length) {
    return <div className="empty-state">Nenhum registro encontrado.</div>;
  }

  if (!finalizados) {
    return <ActiveQueueCards items={items} onAction={onAction} onMove={onMove} busyId={busyId} canViewAudit={canViewAudit} />;
  }

  return (
    <div className="table-shell">
      <table>
        <thead>
          <tr>
            {columns.filter((column) => canViewAudit || column !== 'auditoria').map((column) => (
              <th key={column}>{column}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td data-label="ordem">
                <strong>{item.ordem}</strong>
              </td>
              <td data-label="data">{formatDate(item.data)}</td>
              <td data-label="hora">{formatTime(item.hora)}</td>
              <td data-label="placa">
                <strong className="plate">{item.placa}</strong>
              </td>
              <td data-label="tipo_veiculo">{item.tipo_veiculo || 'Truck'}</td>
              <td data-label="placa_cavalo">{item.placa_cavalo || '-'}</td>
              <td data-label="placa_carreta">{item.placa_carreta || '-'}</td>
              <td data-label="motorista">{item.motorista}</td>
              <td data-label="telefone">{item.telefone || '-'}</td>
              <td data-label="rota_1">{item.rota_1 || '-'}</td>
              <td data-label="rota_2">{item.rota_2 || '-'}</td>
              <td data-label="rota_3">{item.rota_3 || '-'}</td>
              <td data-label="primeira_ligacao">{formatTime(item.primeira_ligacao)}</td>
              <td data-label="segunda_ligacao">{formatTime(item.segunda_ligacao)}</td>
              <td data-label="terceira_ligacao">{formatTime(item.terceira_ligacao)}</td>
              <td data-label="status">
                <StatusBadge status={item.status} />
              </td>
              <td data-label="responsavel">{item.responsavel_email || item.responsavel || '-'}</td>
              <td data-label="ocorrido" className="notes-cell">
                {item.ocorrido || '-'}
              </td>
              {canViewAudit && (
                <td data-label="auditoria" className="audit-cell">
                  <AuditInfo item={item} />
                </td>
              )}
              <td data-label="ações">
                <span className="muted">Encerrado</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
