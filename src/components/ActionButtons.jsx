import { ArrowDown, ArrowDownToLine, ArrowUp, Check, History, Loader, Megaphone, Pencil, Phone, PhoneOff, X } from 'lucide-react';

function ActionGroup({ title, children }) {
  return (
    <div className="action-group">
      <span>{title}</span>
      <div className="action-group-buttons">{children}</div>
    </div>
  );
}

export default function ActionButtons({ item, index, itemsLength, busyId, canViewAudit, onAction, onMove, onEdit, onAudit }) {
  const disabled = busyId === item.id;

  return (
    <div className="queue-actions">
      <ActionGroup title="Ligações">
        <button className="queue-action neutral" title="1ª ligação" disabled={disabled} onClick={() => onAction(item, 'primeira')}>
          <Phone size={14} />
          1ª
        </button>
        <button className="queue-action neutral" title="2ª ligação" disabled={disabled} onClick={() => onAction(item, 'segunda')}>
          <Phone size={14} />
          2ª
        </button>
        <button className="queue-action neutral" title="3ª ligação" disabled={disabled} onClick={() => onAction(item, 'terceira')}>
          <Phone size={14} />
          3ª
        </button>
      </ActionGroup>

      <ActionGroup title="Status">
        <button className="queue-action blue-soft" title="Editar cadastro" disabled={disabled} onClick={() => onEdit?.(item)}>
          <Pencil size={14} />
          Editar
        </button>
        {canViewAudit && (
          <button className="queue-action neutral" title="Histórico" disabled={disabled} onClick={() => onAudit?.(item)}>
            <History size={14} />
            Histórico
          </button>
        )}
        <button className="queue-action danger-soft" title="Não atendeu" disabled={disabled} onClick={() => onAction(item, 'nao_atendeu')}>
          <PhoneOff size={14} />
          Não atendeu
        </button>
        <button className="queue-action blue-soft" title="Chamado" disabled={disabled} onClick={() => onAction(item, 'chamado')}>
          <Megaphone size={14} />
          Chamado
        </button>
        <button className="queue-action blue-soft" title="Chegou" disabled={disabled} onClick={() => onAction(item, 'chegou')}>
          <Check size={14} />
          Chegou
        </button>
        <button className="queue-action purple-soft" title="Carregando" disabled={disabled} onClick={() => onAction(item, 'carregando')}>
          <Loader size={14} />
          Carregando
        </button>
        <button className="queue-action success-soft" title="Finalizar" disabled={disabled} onClick={() => onAction(item, 'finalizar')}>
          <Check size={14} />
          Finalizar
        </button>
        <button className="queue-action danger-soft" title="Cancelar" disabled={disabled} onClick={() => onAction(item, 'cancelar')}>
          <X size={14} />
          Cancelar
        </button>
      </ActionGroup>

      <ActionGroup title="Ordem">
        <button className="queue-action neutral" title="Subir" disabled={index === 0 || disabled} onClick={() => onMove(item, index, 'up')}>
          <ArrowUp size={14} />
          Subir
        </button>
        <button className="queue-action neutral" title="Descer" disabled={index === itemsLength - 1 || disabled} onClick={() => onMove(item, index, 'down')}>
          <ArrowDown size={14} />
          Descer
        </button>
        <button className="queue-action neutral" title="Mandar para o fim" disabled={disabled} onClick={() => onMove(item, index, 'end')}>
          <ArrowDownToLine size={14} />
          Fim
        </button>
      </ActionGroup>
    </div>
  );
}
