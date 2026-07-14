import { X } from 'lucide-react';
import { formatDateTime } from '../services/placasService';

const movementActions = ['Movido para o fim', 'Não atendeu', 'Subiu posição', 'Desceu posição', 'Reabertura'];
const isMovementAudit = (entry) => movementActions.includes(entry.acao);
const hasMovementDetails = (entry) => String(entry.detalhes || '').startsWith('Movimento na fila');

export default function AuditHistoryModal({ item, entries, loading, error, onClose }) {
  if (!item) return null;

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <section className="form-modal audit-history-modal" role="dialog" aria-modal="true" aria-labelledby="audit-history-title" onClick={(event) => event.stopPropagation()}>
        <header className="details-header">
          <div>
            <span className="eyebrow">Auditoria</span>
            <h2 id="audit-history-title">Histórico da placa {item.placa}</h2>
            <p>{item.motorista || '-'}</p>
          </div>
          <button className="icon-only" type="button" onClick={onClose} aria-label="Fechar histórico">
            <X size={20} aria-hidden="true" />
          </button>
        </header>

        {error && <div className="alert error">{error}</div>}

        {loading ? (
          <div className="empty-state">Carregando histórico...</div>
        ) : entries.length ? (
          <div className="audit-timeline">
            {entries.map((entry) => (
              <article className="audit-timeline-item" key={entry.id}>
                <div>
                  <strong>{entry.acao}</strong>
                  <span>{formatDateTime(entry.created_at)}</span>
                </div>
                <p>
                  Por: <strong>{entry.alterado_por || '-'}</strong>
                </p>
                {(entry.status_anterior || entry.status_novo) && (
                  <p>
                    Status: {entry.status_anterior || '-'} → {entry.status_novo || '-'}
                  </p>
                )}
                {isMovementAudit(entry) && !hasMovementDetails(entry) && <p className="audit-details">Movimento na fila registrado.</p>}
                {(entry.ordem_anterior || entry.ordem_nova) && !isMovementAudit(entry) && (
                  <p>
                    Ordem: {entry.ordem_anterior ?? '-'} → {entry.ordem_nova ?? '-'}
                  </p>
                )}
                {entry.detalhes && <p className="audit-details">{entry.detalhes}</p>}
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-state">Nenhum histórico encontrado.</div>
        )}
      </section>
    </div>
  );
}
