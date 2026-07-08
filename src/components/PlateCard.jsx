import { useState } from 'react';
import ActionButtons from './ActionButtons';
import StatusBadge from './StatusBadge';
import { formatBodyType, formatCurrency, formatDate, formatDateTime, formatTime } from '../services/placasService';

const valueOrDash = (value) => value || <span className="soft-empty">-</span>;

function InfoBlock({ title, children, className = '' }) {
  return (
    <section className={`plate-info-block ${className}`}>
      <span>{title}</span>
      <div>{children}</div>
    </section>
  );
}

function buildCreatedAt(item) {
  if (item.created_at) return new Date(item.created_at);
  if (item.data && item.hora) return new Date(`${item.data}T${item.hora}`);
  if (item.data) return new Date(`${item.data}T00:00:00`);
  return null;
}

function relativeTime(dateValue) {
  if (!dateValue || Number.isNaN(dateValue.getTime())) return '-';

  const diffMinutes = Math.max(0, Math.floor((Date.now() - dateValue.getTime()) / 60000));
  if (diffMinutes < 60) return `há ${diffMinutes} min`;

  const diffHours = Math.floor(diffMinutes / 60);
  const remainingMinutes = diffMinutes % 60;
  if (diffHours < 24) return `há ${diffHours}h ${remainingMinutes}min`;

  const diffDays = Math.floor(diffHours / 24);
  return `há ${diffDays} dia${diffDays === 1 ? '' : 's'}`;
}

function waitLevel(createdAt) {
  if (!createdAt || Number.isNaN(createdAt.getTime())) return '';
  const minutes = Math.max(0, Math.floor((Date.now() - createdAt.getTime()) / 60000));
  if (minutes >= 60) return 'time-alert';
  if (minutes >= 30) return 'time-attention';
  return '';
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

  return null;
}

function VehicleSummary({ item }) {
  const badges = (
    <span className="local-badge-row">
      {item.entrega_local && <span className="local-badge">Entrega local</span>}
      {(item.retorno_local || item.prioridade_local) && <span className="local-badge priority">Prioridade local</span>}
    </span>
  );

  if (item.tipo_veiculo === 'Carreta') {
    return (
      <small className="vehicle-summary">
        <span>Carreta | {formatBodyType(item.tipo_carroceria)} | Cavalo: {item.placa_cavalo || item.placa || '-'} | Carreta: {item.placa_carreta || '-'}</span>
        {badges}
      </small>
    );
  }

  return (
    <small className="vehicle-summary">
      <span>Truck | {formatBodyType(item.tipo_carroceria)} | Placa: {item.placa || '-'}</span>
      {badges}
    </small>
  );
}

function OccurredText({ value }) {
  const [expanded, setExpanded] = useState(false);
  if (!value) return <small className="soft-empty">-</small>;

  const isLong = value.length > 150 || value.split('\n').length > 2;
  const displayValue = expanded || !isLong ? value : `${value.slice(0, 150).trim()}...`;
  const parts = displayValue.split(/(\[Cancelamento\]|\[Reabertura\])/gi).filter(Boolean);

  return (
    <div className="occurred-text">
      <p className={expanded ? '' : 'collapsed'}>
        {parts.map((part, index) =>
          /^\[(cancelamento|reabertura)\]$/i.test(part) ? (
            <span className="occurred-tag" key={`${part}-${index}`}>
              {part}
            </span>
          ) : (
            <span key={`${part}-${index}`}>{part}</span>
          )
        )}
      </p>
      {isLong && (
        <button className="text-button" type="button" onClick={() => setExpanded((current) => !current)}>
          {expanded ? 'Ver menos' : 'Ver mais'}
        </button>
      )}
    </div>
  );
}

export default function PlateCard({ item, index, visualOrder, itemsLength, busyId, canViewAudit, canManageQueue, onAction, onMove, onEdit, onAudit, onPriority }) {
  const rotas = [item.rota_1, item.rota_2, item.rota_3].filter(Boolean);
  const createdAt = buildCreatedAt(item);
  const updatedAt = item.updated_at ? new Date(item.updated_at) : createdAt;
  const showLastAction = updatedAt && createdAt && Math.abs(updatedAt.getTime() - createdAt.getTime()) > 60000;

  return (
    <article className="plate-card">
      <header className="plate-card-header">
        <div className="plate-card-title">
          <div className="plate-card-topline">
            <div className="plate-card-main">
              <span className="queue-order">#{visualOrder}</span>
              <strong>{item.placa}</strong>
            </div>
            <StatusBadge status={item.status} />
          </div>
          <VehicleSummary item={item} />
          <div className="plate-card-driver">
            <span>{item.motorista}</span>
            <small>{valueOrDash(item.telefone)}</small>
          </div>
          <div className={`plate-time-row ${waitLevel(createdAt)}`}>
            <small>Cadastrado {relativeTime(createdAt)}</small>
            {showLastAction && <small>Última ação {relativeTime(updatedAt)}</small>}
          </div>
        </div>
      </header>

      <div className="plate-card-body">
        <InfoBlock title="Data/Hora">
          <strong>{formatDate(item.data)}</strong>
          <small>{formatTime(item.hora)}</small>
        </InfoBlock>

        <InfoBlock title="Rotas">
          {rotas.length ? (
            <div className="route-list">
              {rotas.map((rota, rotaIndex) => (
                <small key={`${rota}-${rotaIndex}`}>{rota}</small>
              ))}
            </div>
          ) : (
            <small className="soft-empty">-</small>
          )}
        </InfoBlock>

        <InfoBlock title="Ligações">
          <div className="call-list">
            <small>1ª {formatTime(item.primeira_ligacao)}</small>
            <small>2ª {formatTime(item.segunda_ligacao)}</small>
            <small>3ª {formatTime(item.terceira_ligacao)}</small>
          </div>
        </InfoBlock>

        <InfoBlock title="Responsável">
          <small>{item.responsavel_email || item.responsavel || '-'}</small>
        </InfoBlock>

        {(item.cidade_destino || item.valor_frete_carreteiro) && (
          <InfoBlock title="Frete">
            <div className="call-list">
              <small>Cidade: {item.cidade_destino || '-'}</small>
              <small>Valor: {formatCurrency(item.valor_frete_carreteiro)}</small>
            </div>
          </InfoBlock>
        )}

        {item.ocorrido && (
          <InfoBlock title="Ocorrido" className="occurred-block">
            <OccurredText value={item.ocorrido} />
          </InfoBlock>
        )}

        {canViewAudit && ['Finalizado', 'Cancelado'].includes(item.status) && (
          <InfoBlock title="Auditoria">
            <AuditInfo item={item} />
          </InfoBlock>
        )}
      </div>

      <footer className="plate-card-footer">
        <ActionButtons
          item={item}
          index={index}
          itemsLength={itemsLength}
          busyId={busyId}
          canViewAudit={canViewAudit}
          canManageQueue={canManageQueue}
          onAction={onAction}
          onMove={onMove}
          onEdit={onEdit}
          onAudit={onAudit}
          onPriority={onPriority}
        />
      </footer>
    </article>
  );
}
