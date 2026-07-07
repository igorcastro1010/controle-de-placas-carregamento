import { RotateCcw, X } from 'lucide-react';
import ActionButtons from './ActionButtons';
import StatusBadge from './StatusBadge';
import { formatDate, formatDateTime, formatTime } from '../services/placasService';

const isClosed = (status) => ['Finalizado', 'Cancelado'].includes((status || '').trim());

function DetailField({ label, children }) {
  return (
    <div className="detail-field">
      <span>{label}</span>
      <strong>{children || '-'}</strong>
    </div>
  );
}

function AuditInfo({ item }) {
  if (!item) return null;

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

  return null;
}

function VehicleLine({ item }) {
  if (!item) return 'Truck | Placa: -';
  if (item.tipo_veiculo === 'Carreta') return `Carreta | Cavalo: ${item.placa_cavalo || item.placa || '-'} | Carreta: ${item.placa_carreta || '-'}`;
  return `Truck | Placa: ${item.placa || '-'}`;
}

function LocalBadges({ item }) {
  if (!item?.entrega_local && !item?.prioridade_local && !item?.retorno_local) return null;

  return (
    <span className="local-badge-row">
      {item.entrega_local && <span className="local-badge">Entrega local</span>}
      {(item.prioridade_local || item.retorno_local) && <span className="local-badge priority">Prioridade local</span>}
    </span>
  );
}

export default function DetailsModal({
  card,
  date,
  search,
  items,
  loading,
  error,
  canViewAudit = false,
  canManageQueue = false,
  onDateChange,
  onSearchChange,
  onClearFilters,
  onAction,
  onMove,
  onEdit,
  onAudit,
  onReopen,
  onPriority,
  busyId,
  onClose,
}) {
  if (!card) return null;

  const safeItems = Array.isArray(items) ? items.filter(Boolean) : [];

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <section className="details-modal" role="dialog" aria-modal="true" aria-labelledby="details-modal-title" onClick={(event) => event.stopPropagation()}>
        <header className="details-header">
          <div>
            <span className="eyebrow">Detalhes</span>
            <h2 id="details-modal-title">{card.label}</h2>
            <p>{loading ? 'Carregando registros...' : `${safeItems.length} registro${safeItems.length === 1 ? '' : 's'} encontrado${safeItems.length === 1 ? '' : 's'}`}</p>
          </div>
          <button className="icon-only" type="button" onClick={onClose} aria-label="Fechar painel">
            <X size={20} aria-hidden="true" />
          </button>
        </header>

        <div className="details-toolbar">
          <label>
            Data
            <input type="date" value={date || ''} onChange={(event) => onDateChange(event.target.value)} />
          </label>
          <label className="details-search-field">
            Placa ou motorista
            <input value={search || ''} onChange={(event) => onSearchChange(event.target.value)} placeholder="Digite a placa ou nome" />
          </label>
          <button className="icon-text secondary" type="button" onClick={onClearFilters}>
            Limpar filtros
          </button>
        </div>

        {error && <div className="alert error">{error}</div>}

        {loading ? (
          <div className="empty-state">Carregando detalhes...</div>
        ) : safeItems.length ? (
          <div className="details-card-list">
            {safeItems.map((item, index) => (
              <article className="details-record-card" key={item.id}>
                <header className="details-record-header">
                  <div>
                    <span className="queue-order">#{index + 1}</span>
                    <h3>{item.placa}</h3>
                    <small>
                      <VehicleLine item={item} />
                    </small>
                    <LocalBadges item={item} />
                  </div>
                  <StatusBadge status={item.status} />
                </header>

                <div className="details-record-grid">
                  <DetailField label="Motorista">{item.motorista}</DetailField>
                  <DetailField label="Telefone">{item.telefone}</DetailField>
                  <DetailField label="Data/Hora">
                    {formatDate(item.data)} - {formatTime(item.hora)}
                  </DetailField>
                  <DetailField label="Rotas">{[item.rota_1, item.rota_2, item.rota_3].filter(Boolean).join(' | ') || '-'}</DetailField>
                  <DetailField label="Ligações">
                    1ª {formatTime(item.primeira_ligacao)} | 2ª {formatTime(item.segunda_ligacao)} | 3ª {formatTime(item.terceira_ligacao)}
                  </DetailField>
                  <DetailField label="Responsável">{item.responsavel_email || item.responsavel || '-'}</DetailField>
                  {item.ocorrido && <DetailField label="Ocorrido">{item.ocorrido}</DetailField>}
                  {canViewAudit && isClosed(item.status) && (
                    <div className="detail-field detail-field-wide">
                      <span>Auditoria</span>
                      <AuditInfo item={item} />
                    </div>
                  )}
                </div>

                {isClosed(item.status) ? (
                  <div className="details-closed-note">
                    <span>Registro encerrado. Ações bloqueadas para operadores.</span>
                    {canViewAudit && (
                      <div className="closed-action-row">
                        <button className="queue-action neutral audit-inline-button" type="button" onClick={() => onAudit?.(item)}>
                          Histórico
                        </button>
                        {canManageQueue && (
                          <button className="queue-action success-soft audit-inline-button" type="button" onClick={() => onReopen?.(item)}>
                            <RotateCcw size={14} aria-hidden="true" />
                            Reabrir
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="details-actions">
                    <ActionButtons
                      item={item}
                      index={index}
                      itemsLength={safeItems.length}
                      busyId={busyId}
                      canViewAudit={canViewAudit}
                      canManageQueue={canManageQueue}
                      onAction={onAction}
                      onEdit={onEdit}
                      onAudit={onAudit}
                      onPriority={onPriority}
                      onMove={(current, currentIndex, direction) => onMove(current, currentIndex, direction, safeItems)}
                    />
                  </div>
                )}
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-state">Nenhum registro encontrado</div>
        )}
      </section>
    </div>
  );
}
