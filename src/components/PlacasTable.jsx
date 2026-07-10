import { useEffect, useMemo, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import PlateCard from './PlateCard';
import StatusBadge from './StatusBadge';
import { formatBodyType, formatCurrency, formatDate, formatDateTime, formatTime, isOutroLocalRecord } from '../services/placasService';

const PAGE_SIZE = 10;

const columns = [
  'ordem',
  'data',
  'hora',
  'placa',
  'tipo_veiculo',
  'tipo_carroceria',
  'placa_cavalo',
  'placa_carreta',
  'entrega_local',
  'prioridade_local',
  'motorista',
  'telefone',
  'rota_1',
  'rota_2',
  'rota_3',
  'cidade_destino',
  'valor_frete',
  'primeira_ligacao',
  'segunda_ligacao',
  'terceira_ligacao',
  'status',
  'responsavel',
  'ocorrido',
  'auditoria',
  'acoes',
];

function PaginationControls({ page, totalPages, totalItems, startItem, endItem, onPageChange }) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);

  return (
    <nav className="pagination-bar" aria-label="Paginacao">
      <span>
        Mostrando {startItem}-{endItem} de {totalItems}
      </span>
      <div className="pagination-actions">
        <button className="pagination-button" type="button" disabled={page === 1} onClick={() => onPageChange(page - 1)}>
          Anterior
        </button>
        {pages.map((pageNumber) => (
          <button className={`pagination-button ${pageNumber === page ? 'active' : ''}`} type="button" key={pageNumber} onClick={() => onPageChange(pageNumber)} aria-current={pageNumber === page ? 'page' : undefined}>
            {pageNumber}
          </button>
        ))}
        <button className="pagination-button" type="button" disabled={page === totalPages} onClick={() => onPageChange(page + 1)}>
          Proxima
        </button>
      </div>
    </nav>
  );
}

function ActiveQueueCards({ items, pageItems, pageStartIndex, onAction, onMove, onEdit, onAudit, onPriority, onOtherLocation, busyId, canViewAudit, canManageQueue }) {
  return (
    <div className="queue-card-list">
      {pageItems.map((item, pageIndex) => {
        const index = pageStartIndex + pageIndex;

        return (
          <PlateCard
            key={item.id}
            item={item}
            index={index}
            visualOrder={item._fila_posicao_real || index + 1}
            itemsLength={items.length}
            busyId={busyId}
            canViewAudit={canViewAudit}
            canManageQueue={canManageQueue}
            onAction={onAction}
            onMove={onMove}
            onEdit={onEdit}
            onAudit={onAudit}
            onPriority={onPriority}
            onOtherLocation={onOtherLocation}
          />
        );
      })}
    </div>
  );
}

function AuditInfo({ item }) {
  if (isOutroLocalRecord(item)) {
    return (
      <div className="audit-info">
        <span>Baixado por: {item.finalizado_por || '-'}</span>
        <span>Baixado em: {formatDateTime(item.finalizado_em)}</span>
        <span>Motivo: Carregou em outro local</span>
      </div>
    );
  }

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

export default function PlacasTable({ items, onAction, onMove, onEdit, onAudit, onReopen, onPriority, onOtherLocation, finalizados = false, busyId, canViewAudit = false, canManageQueue = false }) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageStartIndex = (currentPage - 1) * PAGE_SIZE;
  const pageItems = useMemo(() => items.slice(pageStartIndex, pageStartIndex + PAGE_SIZE), [items, pageStartIndex]);
  const startItem = items.length ? pageStartIndex + 1 : 0;
  const endItem = Math.min(pageStartIndex + pageItems.length, items.length);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  if (!items.length) {
    return <div className="empty-state">Nenhum registro encontrado.</div>;
  }

  if (!finalizados) {
    return (
      <>
        <ActiveQueueCards items={items} pageItems={pageItems} pageStartIndex={pageStartIndex} onAction={onAction} onMove={onMove} onEdit={onEdit} onAudit={onAudit} onPriority={onPriority} onOtherLocation={onOtherLocation} busyId={busyId} canViewAudit={canViewAudit} canManageQueue={canManageQueue} />
        <PaginationControls page={currentPage} totalPages={totalPages} totalItems={items.length} startItem={startItem} endItem={endItem} onPageChange={setPage} />
      </>
    );
  }

  return (
    <>
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
            {pageItems.map((item, pageIndex) => {
              const index = pageStartIndex + pageIndex;

              return (
                <tr key={item.id}>
                  <td data-label="ordem">
                    <strong>{index + 1}</strong>
                  </td>
                  <td data-label="data">{formatDate(item.data)}</td>
                  <td data-label="hora">{formatTime(item.hora)}</td>
                  <td data-label="placa">
                    <strong className="plate">{item.placa}</strong>
                  </td>
                  <td data-label="tipo_veiculo">{item.tipo_veiculo || 'Truck'}</td>
                  <td data-label="tipo_carroceria">{formatBodyType(item.tipo_carroceria)}</td>
                  <td data-label="placa_cavalo">{item.placa_cavalo || '-'}</td>
                  <td data-label="placa_carreta">{item.placa_carreta || '-'}</td>
                  <td data-label="entrega_local">{item.entrega_local ? 'Sim' : 'Nao'}</td>
                  <td data-label="prioridade_local">{item.prioridade_local ? 'Sim' : 'Nao'}</td>
                  <td data-label="motorista">{item.motorista}</td>
                  <td data-label="telefone">{item.telefone || '-'}</td>
                  <td data-label="rota_1">{item.rota_1 || '-'}</td>
                  <td data-label="rota_2">{item.rota_2 || '-'}</td>
                  <td data-label="rota_3">{item.rota_3 || '-'}</td>
                  <td data-label="cidade_destino">{item.cidade_destino || '-'}</td>
                  <td data-label="valor_frete">{formatCurrency(item.valor_frete_carreteiro)}</td>
                  <td data-label="primeira_ligacao">{formatTime(item.primeira_ligacao)}</td>
                  <td data-label="segunda_ligacao">{formatTime(item.segunda_ligacao)}</td>
                  <td data-label="terceira_ligacao">{formatTime(item.terceira_ligacao)}</td>
                  <td data-label="status">
                    <StatusBadge status={isOutroLocalRecord(item) ? 'Carregado em outro local' : item.status} />
                  </td>
                  <td data-label="responsavel">{item.responsavel_email || item.responsavel || '-'}</td>
                  <td data-label="ocorrido" className="notes-cell">
                    {item.ocorrido || '-'}
                  </td>
                  {canViewAudit && (
                    <td data-label="auditoria" className="audit-cell">
                      <AuditInfo item={item} />
                      <div className="closed-action-row">
                        <button className="queue-action neutral audit-inline-button" type="button" onClick={() => onAudit?.(item)}>
                          Historico
                        </button>
                        {canManageQueue && (
                          <button className="queue-action success-soft audit-inline-button" type="button" onClick={() => onReopen?.(item)}>
                            <RotateCcw size={14} aria-hidden="true" />
                            Reabrir
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                  <td data-label="acoes">
                    <span className="muted">Encerrado</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <PaginationControls page={currentPage} totalPages={totalPages} totalItems={items.length} startItem={startItem} endItem={endItem} onPageChange={setPage} />
    </>
  );
}
