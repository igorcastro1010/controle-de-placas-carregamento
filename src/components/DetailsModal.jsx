import { Fragment } from 'react';
import { X } from 'lucide-react';
import StatusBadge from './StatusBadge';
import { formatDate, formatDateTime, formatTime } from '../services/placasService';

const detailColumns = [
  ['ordem', 'ordem'],
  ['data', 'data'],
  ['hora', 'hora'],
  ['placa', 'placa'],
  ['motorista', 'motorista'],
  ['telefone', 'telefone'],
  ['rota_1', 'rota_1'],
  ['rota_2', 'rota_2'],
  ['rota_3', 'rota_3'],
  ['primeira_ligacao', 'primeira_ligacao'],
  ['segunda_ligacao', 'segunda_ligacao'],
  ['terceira_ligacao', 'terceira_ligacao'],
  ['status', 'status'],
  ['responsavel', 'responsavel_email'],
  ['ocorrido', 'ocorrido'],
];

const formatValue = (column, item) => {
  if (column === 'responsavel_email') return item.responsavel_email || item.responsavel || '-';
  const value = item[column];
  if (column === 'data') return formatDate(value);
  if (['hora', 'primeira_ligacao', 'segunda_ligacao', 'terceira_ligacao'].includes(column)) return formatTime(value);
  return value || '-';
};

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

  return null;
}

export default function DetailsModal({
  card,
  date,
  search,
  items,
  loading,
  error,
  canViewAudit = false,
  onDateChange,
  onSearchChange,
  onClearFilters,
  onClose,
}) {
  if (!card) return null;

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="details-modal" role="dialog" aria-modal="true" aria-labelledby="details-modal-title">
        <header className="details-header">
          <div>
            <span className="eyebrow">Detalhes</span>
            <h2 id="details-modal-title">{card.label}</h2>
            <p>{loading ? 'Carregando registros...' : `${items.length} registro${items.length === 1 ? '' : 's'} encontrado${items.length === 1 ? '' : 's'}`}</p>
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
            Limpar filtro
          </button>
        </div>

        {error && <div className="alert error">{error}</div>}

        {loading ? (
          <div className="empty-state">Carregando detalhes...</div>
        ) : items.length ? (
          <div className="table-shell details-table-shell">
            <table className="details-table">
              <thead>
                <tr>
                  {detailColumns.map(([label]) => (
                    <th key={label}>{label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <Fragment key={item.id}>
                    <tr key={item.id}>
                      {detailColumns.map(([label, column]) => (
                        <td key={label} data-label={label} className={column === 'ocorrido' ? 'notes-cell' : ''}>
                          {column === 'status' ? <StatusBadge status={item.status} /> : formatValue(column, item)}
                        </td>
                      ))}
                    </tr>
                    {canViewAudit && ['Finalizado', 'Cancelado'].includes(item.status) && (
                      <tr className="audit-row" key={`${item.id}-audit`}>
                        <td colSpan={detailColumns.length}>
                          <AuditInfo item={item} />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">Nenhum registro encontrado</div>
        )}
      </section>
    </div>
  );
}
