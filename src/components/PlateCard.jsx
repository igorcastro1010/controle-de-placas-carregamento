import ActionButtons from './ActionButtons';
import StatusBadge from './StatusBadge';
import { formatDate, formatDateTime, formatTime } from '../services/placasService';

const valueOrDash = (value) => value || <span className="soft-empty">-</span>;

function InfoBlock({ title, children }) {
  return (
    <section className="plate-info-block">
      <span>{title}</span>
      <div>{children}</div>
    </section>
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

  return null;
}

export default function PlateCard({ item, index, visualOrder, itemsLength, busyId, canViewAudit, onAction, onMove }) {
  const rotas = [item.rota_1, item.rota_2, item.rota_3].filter(Boolean);

  return (
    <article className="plate-card">
      <header className="plate-card-header">
        <div className="plate-card-title">
          <div className="plate-card-main">
            <span className="queue-order">#{visualOrder}</span>
            <strong>{item.placa}</strong>
          </div>
          <div className="plate-card-driver">
            <span>{item.motorista}</span>
            <small>{valueOrDash(item.telefone)}</small>
          </div>
        </div>
        <StatusBadge status={item.status} />
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

        {item.ocorrido && (
          <InfoBlock title="Ocorrido">
            <small>{item.ocorrido}</small>
          </InfoBlock>
        )}

        {canViewAudit && ['Finalizado', 'Cancelado'].includes(item.status) && (
          <InfoBlock title="Auditoria">
            <AuditInfo item={item} />
          </InfoBlock>
        )}
      </div>

      <footer className="plate-card-footer">
        <ActionButtons item={item} index={index} itemsLength={itemsLength} busyId={busyId} onAction={onAction} onMove={onMove} />
      </footer>
    </article>
  );
}
